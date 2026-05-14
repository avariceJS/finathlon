export type FaqEntry = {
  id: string
  question: string
  answer: string
  sortOrder: number
  isPublished: boolean
}

export type FaqEntryInput = {
  question: string
  answer: string
  sortOrder?: number
  isPublished?: boolean
}
