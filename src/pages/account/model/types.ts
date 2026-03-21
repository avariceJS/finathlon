import type {
    ContactsData,
    FooterColumn,
    NavItem,
    SocialLink,
  } from '@/pages/home/model/types'
  
  export type AccountSectionKey =
    | 'personal'
    | 'events'
    | 'achievements'
    | 'notifications'
  
  export type AccountSidebarItem = {
    key: AccountSectionKey
    label: string
  }
  
  export type AccountProfile = {
    fullName: string
    subtitle: string
  }
  
  export type AccountFieldType = 'text' | 'email' | 'password' | 'date'
  
  export type AccountField = {
    id: string
    label: string
    value: string
    type?: AccountFieldType
  }
  
  export type AccountNotification = {
    id: string
    title: string
    description: string
    documentUrl?: string
    isRead: boolean
  }
  
  export type AccountAchievement = {
    id: string
    title: string
    description: string
    progressCurrent: number
    progressTotal: number
  }
  
  export type AccountEvent = {
    id: string
    year: number
    dateLabel: string
    title: string
    result: string
    publicationUrl?: string
    diplomaUrl?: string
  }
  
  export type AccountPageData = {
    siteNavigation: NavItem[]
    sidebarItems: AccountSidebarItem[]
    profile: AccountProfile
    personalFields: AccountField[]
    notifications: AccountNotification[]
    achievements: AccountAchievement[]
    events: AccountEvent[]
    contacts: ContactsData
    footerColumns: FooterColumn[]
    socials: SocialLink[]
  }