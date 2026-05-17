import type { UserRole } from '@/shared/supabase'

export type Profile = {
  id: string
  role: UserRole
  firstName: string
  lastName: string
  middleName: string
  email: string
  username: string
  phone: string
  birthDate: string
  country: string
  city: string
  school: string
  classCourse: string
  telegram: string
  vk: string
  avatarUrl: string | null
  bio: string
  isComplete: boolean
  createdAt: string
  updatedAt: string
}

export type ProfileFormValues = {
  firstName: string
  lastName: string
  middleName: string
  phone: string
  birthDate: string
  country: string
  city: string
  school: string
  classCourse: string
  telegram: string
  vk: string
  bio: string
}

export type UserNotification = {
  id: string
  title: string
  description: string
  documentUrl: string | null
  isRead: boolean
  createdAt: string
}

export type UserAchievement = {
  id: string
  title: string
  description: string
  progressCurrent: number
  progressTotal: number
  createdAt: string
}

export type UserEvent = {
  id: string
  year: number
  dateLabel: string
  title: string
  result: string
  publicationUrl: string | null
  diplomaUrl: string | null
  createdAt: string
}
