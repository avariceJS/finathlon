import type {
  DemoAttempt,
  DemoImportReport,
  DemoQuestion,
  DemoResult,
  DemoSession,
} from '@/entities/demo-test/model'

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
  username: string | null
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
  federal_district: string | null
  region: string | null
  postal_code: string | null
  locality_type: string | null
  address: string | null
  is_rural: boolean | null
  school_address: string | null
  school_phone: string | null
  school_email: string | null
  is_orphan: boolean | null
  has_disability: boolean | null
  motivation: string | null
  finance_interest: string | null
  info_source: string | null
  parent_full_name: string | null
  parent_email: string | null
  parent_phone: string | null
  organizations: string | null
  teacher_full_name: string | null
  teacher_phone: string | null
  teacher_email: string | null
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

export type DocumentSectionRow = {
  id: string
  parent_id: string | null
  title: string
  slug: string
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
  section_id: string | null 
  file_url: string | null
  file_name: string | null
  source: 'olympiad' | 'rsosh' | null
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

export type OlympiadRow = {
  id: string
  slug: string
  title: string
  profile_title: string | null
  description: string | null
  season: string | null
  year: number
  format: 'online' | 'offline'
  status: 'draft' | 'published' | 'completed' | 'archived'
  start_date: string | null
  end_date: string | null
  max_participants: number | null
  is_published: boolean
  rich_content: string | null
  registration_open: boolean | null
  created_at: string
  updated_at: string
}

export type OlympiadProfileRow = {
  id: string
  user_id: string
  olympiad_id: string
  olympiad_year: number
  category: 'general' | '8-9' | '10-11' | 'university'
  score: number
  rank: 'participant' | 'winner' | 'prize_winner' | 'finalist'
  diploma_url: string | null
  certificate_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type OlympiadRegistrationRow = {
  id: string
  user_id: string
  profile_id: string
  email: string
  last_name: string
  first_name: string
  middle_name: string | null
  form_data: Json
  status: string
  created_at: string
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
      document_sections: Tbl<
        DocumentSectionRow,
        Partial<DocumentSectionRow> & { title: string; slug: string },
        Partial<DocumentSectionRow>
      >
      demo_questions: Tbl<
        DemoQuestion,
        DemoQuestion,
        Pick<DemoQuestion, 'body'>
      >
      demo_import_reports: Tbl<DemoImportReport, never, never>
      demo_attempts: Tbl<DemoAttempt, never, never>
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
      olympiads: Tbl<
        OlympiadRow,
        Partial<OlympiadRow> & { slug: string; title: string; year: number },
        Partial<OlympiadRow>
      >
      olympiad_profiles: Tbl<
        OlympiadProfileRow,
        Partial<OlympiadProfileRow> & {
          user_id: string
          olympiad_id: string
          olympiad_year: number
        },
        Partial<OlympiadProfileRow>
      >
      olympiad_registrations: Tbl<
        OlympiadRegistrationRow,
        Partial<OlympiadRegistrationRow> & {
          user_id: string
          profile_id: string
          email: string
          last_name: string
          first_name: string
        },
        Partial<OlympiadRegistrationRow>
      >
    }
    Views: Record<string, never>
    Functions: {
      demo_import: {
        Args: { p_questions: DemoQuestion[]; p_reports: DemoImportReport[] }
        Returns: undefined
      }
      demo_start: {
        Args: {
          p_profile: string
          p_grades: string
          p_region: string
          p_city: string
        }
        Returns: DemoSession
      }
      demo_finish: {
        Args: { p_attempt: string; p_answers: string[][] }
        Returns: DemoResult
      }
      is_admin: { Args: { uid: string }; Returns: boolean }
      resolve_auth_email: { Args: { p_identifier: string }; Returns: string }
      release_orphan_auth_email: {
        Args: { p_email: string }
        Returns: boolean
      }
      olympiad_profile_is_open: {
        Args: { p_profile_id: string }
        Returns: boolean
      }
      register_for_olympiad_profile: {
        Args: { p_profile_id: string; p_form: Json }
        Returns: string
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
