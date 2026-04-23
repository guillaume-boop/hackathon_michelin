export type MichelinStars = 0 | 1 | 2 | 3
export type GreenStars = true | false
export type DietaryOption = 'vegan' | 'veggie' | null
export type PriceRange = '€' | '€€' | '€€€' | '€€€€' | '$' | '$$' | '$$$' | '$$$$'

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
  price_range?: PriceRange
  cuisine?: string
  facilities?: string[]
  address?: string
  phone_number?: string
  michelin_url?: string
  website_url?: string
  created_at: string
}
