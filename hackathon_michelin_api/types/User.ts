export type UserRole = 'user' | 'chef' | 'admin'
 
export interface User {
  id: string
  username: string
  email: string
  avatar_url: string | null
  role: UserRole
  circle_score: number
  created_at: string
}
 