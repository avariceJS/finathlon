export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'user' | 'admin'

export type ProfileRow = {
  id: string
  role: UserRole
  first_name: string | null
  last_name: string | null
  middle_name: string | null
  email: string | null
  phone: string | null
  birth_date: string | null
  country: string | null
  city: string | null
  school: string | null
  class_course: string | null
  telegram: string | null
  vk: string | null
  avatar_url: string | null
  bio: string | null
  is_complete: boolean
  created_at: string
  updated_at: string
}

export type ProfileUpdate = Partial<
  Omit<ProfileRow, 'id' | 'role' | 'created_at' | 'updated_at' | 'is_complete'>
>

export type UserEventRow = {
  id: string
  user_id: string
  year: number
  date_label: string
  title: string
  result: string | null
  publication_url: string | null
  diploma_url: string | null
  created_at: string
}

export type AchievementRow = {
  id: string
  user_id: string
  title: string
  description: string | null
  progress_current: number
  progress_total: number
  created_at: string
}

export type NotificationRow = {
  id: string
  user_id: string
  title: string
  description: string | null
  document_url: string | null
  is_read: boolean
  created_at: string
}

export type NewsRow = {
  id: string
  slug: string
  title: string
  summary: string | null
  content: string | null
  cover_url: string | null
  author_name: string | null
  is_published: boolean
  published_at: string
  created_at: string
  updated_at: string
}

export type ProgramRow = {
  id: string
  slug: string
  title: string
  summary: string | null
  description: string | null
  highlights: string[]
  cta_label: string | null
  cta_href: string | null
  sort_order: number
  is_published: boolean
  created_at: string
  updated_at: string
}

export type TimelineEventRow = {
  id: string
  title: string
  date_label: string
  event_year: number
  accent: 'red' | 'blue' | 'green' | 'orange'
  sort_order: number
  is_published: boolean
  created_at: string
}

export type StatRow = {
  id: string
  metric_key: string
  value_text: string
  label: string
  sort_order: number
  is_published: boolean
  updated_at: string
}

export type PartnerRow = {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  website_url: string | null
  kind: 'partner' | 'organizer'
  sort_order: number
  is_published: boolean
  created_at: string
  updated_at: string
}

export type CouncilMemberRow = {
  id: string
  full_name: string
  title: string | null
  bio: string | null
  photo_url: string | null
  sort_order: number
  is_published: boolean
  created_at: string
  updated_at: string
}

export type DocumentRow = {
  id: string
  title: string
  description: string | null
  category: string
  file_url: string | null
  sort_order: number
  is_published: boolean
  created_at: string
  updated_at: string
}

export type FaqRow = {
  id: string
  question: string
  answer: string
  sort_order: number
  is_published: boolean
  created_at: string
}

export type SiteSettingRow = {
  key: string
  value: Json
  updated_at: string
}

type Tbl<Row, Insert, Update> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

export type Database = {
  public: {
    Tables: {
      profiles: Tbl<
        ProfileRow,
        Partial<ProfileRow> & { id: string },
        Partial<ProfileRow>
      >
      user_events: Tbl<
        UserEventRow,
        Partial<UserEventRow> & {
          user_id: string
          year: number
          date_label: string
          title: string
        },
        Partial<UserEventRow>
      >
      achievements: Tbl<
        AchievementRow,
        Partial<AchievementRow> & { user_id: string; title: string },
        Partial<AchievementRow>
      >
      notifications: Tbl<
        NotificationRow,
        Partial<NotificationRow> & { user_id: string; title: string },
        Partial<NotificationRow>
      >
      news: Tbl<
        NewsRow,
        Partial<NewsRow> & { slug: string; title: string },
        Partial<NewsRow>
      >
      programs: Tbl<
        ProgramRow,
        Partial<ProgramRow> & { slug: string; title: string },
        Partial<ProgramRow>
      >
      timeline_events: Tbl<
        TimelineEventRow,
        Partial<TimelineEventRow> & {
          title: string
          date_label: string
          event_year: number
        },
        Partial<TimelineEventRow>
      >
      stats: Tbl<
        StatRow,
        Partial<StatRow> & {
          metric_key: string
          value_text: string
          label: string
        },
        Partial<StatRow>
      >
      partners: Tbl<
        PartnerRow,
        Partial<PartnerRow> & { name: string },
        Partial<PartnerRow>
      >
      council_members: Tbl<
        CouncilMemberRow,
        Partial<CouncilMemberRow> & { full_name: string },
        Partial<CouncilMemberRow>
      >
      documents: Tbl<
        DocumentRow,
        Partial<DocumentRow> & { title: string },
        Partial<DocumentRow>
      >
      faqs: Tbl<
        FaqRow,
        Partial<FaqRow> & { question: string; answer: string },
        Partial<FaqRow>
      >
      site_settings: Tbl<
        SiteSettingRow,
        Partial<SiteSettingRow> & { key: string },
        Partial<SiteSettingRow>
      >
    }
    Views: Record<string, never>
    Functions: { is_admin: { Args: { uid: string }; Returns: boolean } }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
