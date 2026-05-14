export type PartnerKind = 'partner' | 'organizer'

export type Partner = {
  id: string
  name: string
  description: string
  logoUrl: string | null
  websiteUrl: string | null
  kind: PartnerKind
  sortOrder: number
  isPublished: boolean
}

export type PartnerInput = {
  name: string
  description?: string
  logoUrl?: string | null
  websiteUrl?: string | null
  kind?: PartnerKind
  sortOrder?: number
  isPublished?: boolean
}
