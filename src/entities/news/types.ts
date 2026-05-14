export type NewsArticle = {
  id: string
  slug: string
  title: string
  summary: string
  content: string
  coverUrl: string | null
  authorName: string | null
  publishedAt: string
  isPublished: boolean
}

export type NewsArticleInput = {
  slug: string
  title: string
  summary?: string
  content?: string
  coverUrl?: string | null
  authorName?: string | null
  isPublished?: boolean
  publishedAt?: string
}
