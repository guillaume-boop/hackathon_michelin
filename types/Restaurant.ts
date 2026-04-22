export type MichelinStars = 0 | 1 | 2 | 3
export type GreenStars = true | false
export type DietaryOption = 'vegan' | 'veggie' | null

export interface Restaurant {
  id: string
  name: string
  michelin_stars: MichelinStars
  green_stars: GreenStars
  dietary_option: DietaryOption
  city: string
  country: string
  lat: number
  lng: number
  description?: string
  created_at: string
}
