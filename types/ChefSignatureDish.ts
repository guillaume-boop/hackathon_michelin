export interface ChefSignatureDish {
  id: string
  chef_profile_id: string
  name: string
  description: string | null
  photo_url: string | null
  order: number
}
