export type CouncilMember = {
  id: string
  fullName: string
  title: string
  bio: string
  photoUrl: string | null
  sortOrder: number
  isPublished: boolean
}

export type CouncilMemberInput = {
  fullName: string
  title?: string
  bio?: string
  photoUrl?: string | null
  sortOrder?: number
  isPublished?: boolean
}
