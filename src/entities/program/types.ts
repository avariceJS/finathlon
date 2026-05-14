export type Program = {
  id: string
  slug: string
  title: string
  summary: string
  description: string
  highlights: string[]
  ctaLabel: string
  ctaHref: string | null
  sortOrder: number
  isPublished: boolean
}

export type ProgramInput = {
  slug: string
  title: string
  summary?: string
  description?: string
  highlights?: string[]
  ctaLabel?: string
  ctaHref?: string | null
  sortOrder?: number
  isPublished?: boolean
}
