export type FeedPostType = 'video' | 'review' | 'checkin'

export interface FeedPost {
  id: string
  user_id: string
  restaurant_id: string
  type: FeedPostType
  content_url: string | null
  likes_count: number
  created_at: string
  user_liked?: boolean
  user_bookmarked?: boolean
}

export type FeedPostWithRestaurant = FeedPost & {
  restaurants: {
    id: string
    name: string
    city: string
    michelin_stars: number
    green_stars?: boolean
    description?: string
  }
}
