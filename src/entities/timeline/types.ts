export type TimelineAccent = 'red' | 'blue' | 'green' | 'orange'

export type TimelineEvent = {
  id: string
  title: string
  dateLabel: string
  year: number
  accent: TimelineAccent
  sortOrder: number
  isPublished: boolean
}

export type TimelineEventInput = {
  title: string
  dateLabel: string
  year: number
  accent?: TimelineAccent
  sortOrder?: number
  isPublished?: boolean
}
