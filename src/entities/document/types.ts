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
  sectionId: string | null 
  fileUrl: string | null
  fileName: string | null
  source: 'olympiad' | 'rsosh' | null
  sortOrder: number
  isPublished: boolean
}

export type DocumentInput = {
  title: string
  description?: string
  category?: string
  sectionId?: string | null
  fileUrl?: string | null
  fileName?: string | null
  source?: 'olympiad' | 'rsosh' | null
  sortOrder?: number
  isPublished?: boolean
}
