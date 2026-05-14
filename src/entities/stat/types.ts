export type StatItem = {
  id: string
  metricKey: string
  value: string
  label: string
  sortOrder: number
  isPublished: boolean
}

export type StatItemInput = {
  metricKey: string
  value: string
  label: string
  sortOrder?: number
  isPublished?: boolean
}
