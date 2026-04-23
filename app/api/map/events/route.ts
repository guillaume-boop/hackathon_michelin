import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const restaurantId = formData.get('restaurantId') as string
    const rating = parseInt(formData.get('rating') as string)
    const review = formData.get('review') as string
    const userId = formData.get('userId') as string

    if (!restaurantId || !rating || !review || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const imageUrls: string[] = []
    const files = formData.getAll('photos') as File[]
    console.log(`[map/events] Received ${files.length} files`)

    // Upload images to Supabase storage
    for (const file of files) {
      try {
        const buffer = await file.arrayBuffer()
        const filename = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`
        const path = `events/${filename}`

        const { error: uploadError } = await supabaseAdmin.storage
          .from('events')
          .upload(path, buffer, { contentType: 'image/jpeg' })

        if (uploadError) {
          console.error(`[map/events] Upload error for ${filename}:`, uploadError)
          continue
        }

        const { data } = supabaseAdmin.storage.from('events').getPublicUrl(path)
        console.log(`[map/events] Uploaded ${filename} -> ${data.publicUrl}`)
        imageUrls.push(data.publicUrl)
      } catch (fileError) {
        console.error('[map/events] File processing error:', fileError)
      }
    }
    console.log(`[map/events] Final imageUrls count: ${imageUrls.length}`)

    // Insert experience with images
    const { data, error } = await supabaseAdmin.from('experiences').insert({
      user_id: userId,
      restaurant_id: restaurantId,
      rating,
      note: review,
      media_urls: imageUrls,
      visited_at: new Date().toISOString(),
    }).select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
