export type CircleMemberRole = 'owner' | 'member'
 
export interface CircleMember {
  circle_id: string
  user_id: string
  role: CircleMemberRole
}