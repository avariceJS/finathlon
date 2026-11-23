export type OlympiadFormat = 'online' | 'offline'

export type OlympiadStatus = 'draft' | 'published' | 'completed' | 'archived'

export type Olympiad = {
  id: string
  slug: string
  title: string
  profileTitle: string | null
  description: string | null
  season: string | null
  year: number
  format: OlympiadFormat
  registrationOpen: boolean | null
  status: OlympiadStatus
  startDate: string | null
  endDate: string | null
  maxParticipants: number | null
  isPublished: boolean
  richContent: string | null
  createdAt: string
  updatedAt: string
}

export type OlympiadInput = {
  slug: string
  title: string
  profileTitle?: string | null
  description?: string | null
  season?: string | null
  year: number
  format?: OlympiadFormat
  registrationOpen?: boolean | null
  status?: OlympiadStatus
  startDate?: string | null
  endDate?: string | null
  maxParticipants?: number | null
  isPublished?: boolean
  richContent?: string | null
}

export type OlympiadProfileCategory = 'general' | '8-9' | '10-11' | 'university'

export type OlympiadProfileRank =
  | 'participant'
  | 'winner'
  | 'prize_winner'
  | 'finalist'

export type OlympiadProfile = {
  id: string
  userId: string
  olympiadId: string
  olympiadYear: number
  category: OlympiadProfileCategory
  score: number
  rank: OlympiadProfileRank
  diplomaUrl: string | null
  certificateUrl: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type OlympiadProfileInput = {
  userId: string
  olympiadId: string
  olympiadYear: number
  category?: OlympiadProfileCategory
  score?: number
  rank?: OlympiadProfileRank
  diplomaUrl?: string | null
  certificateUrl?: string | null
  notes?: string | null
}

export type RegistrationOlympiadStatus =
  | 'draft'
  | 'published'
  | 'completed'
  | 'archived'

/** Состояние регистрации и тестирования по профилю на текущий момент. */
export type OlympiadProfileAvailability = 'open' | 'upcoming' | 'closed'

export type RegistrationOlympiad = {
  id: string
  olympiadTitle: string
  profileTitle: string
  season: string
  startsAt: string | null
  endsAt: string | null
  summary: string
  status: RegistrationOlympiadStatus
  availability: OlympiadProfileAvailability
}

export type OlympiadRegistration = {
  id: string
  profileId: string
  createdAt: string
  profile: RegistrationOlympiad | null
}
