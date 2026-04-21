export interface Experience {
  id: string
  user_id: string
  restaurant_id: string
  rating: number
  note: string | null
  media_urls: string[]
  visited_at: string
}