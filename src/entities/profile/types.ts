import type { UserRole } from '@/shared/supabase'

/** Ответ «да / нет»; пустая строка — значение ещё не выбрано. */
export type YesNo = '' | 'yes' | 'no'

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
  federalDistrict: string
  region: string
  postalCode: string
  localityType: string
  address: string
  isRural: YesNo
  schoolAddress: string
  schoolPhone: string
  schoolEmail: string
  isOrphan: YesNo
  hasDisability: YesNo
  motivation: string
  financeInterest: string
  infoSource: string
  parentFullName: string
  parentEmail: string
  parentPhone: string
  organizations: string
  teacherFullName: string
  teacherPhone: string
  teacherEmail: string
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
  federalDistrict: string
  region: string
  postalCode: string
  localityType: string
  address: string
  isRural: YesNo
  schoolAddress: string
  schoolPhone: string
  schoolEmail: string
  isOrphan: YesNo
  hasDisability: YesNo
  motivation: string
  financeInterest: string
  infoSource: string
  parentFullName: string
  parentEmail: string
  parentPhone: string
  organizations: string
  teacherFullName: string
  teacherPhone: string
  teacherEmail: string
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
