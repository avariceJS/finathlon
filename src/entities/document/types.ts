export type DocumentCategory =
  | 'general'
  | 'regulations'
  | 'guides'
  | 'reports'

export type DocumentItem = {
  id: string
  title: string
  description: string
  category: string
  fileUrl: string | null
  sortOrder: number
  isPublished: boolean
}

export type DocumentInput = {
  title: string
  description?: string
  category?: string
  fileUrl?: string | null
  sortOrder?: number
  isPublished?: boolean
}
