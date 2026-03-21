export type NavItem = {
    label: string
    href: string
  }
  
  export type HeroData = {
    title: string
    imageAlt: string
  }
  
  export type ParticipationItem = {
    id: string
    title: string
    description: string
    points: string[]
    ctaLabel: string
  }
  
  export type StatItem = {
    id: string
    value: string
    label: string
  }
  
  export type TimelineItem = {
    id: string
    date: string
    label: string
    year: string
    accent: 'red' | 'blue'
    position: string
  }
  
  export type NewsItem = {
    id: string
    title: string
    imageAlt: string
    href: string
  }
  
  export type FaqItem = {
    id: string
    question: string
    answer: string
  }
  
  export type FooterColumn = {
    id: string
    links: Array<{
      label: string
      href: string
    }>
  }
  
  export type ContactsData = {
    phone: string
    email: string
    address: string
  }
  
  export type SocialLink = {
    id: string
    label: string
    href: string
  }
  
  export type HomePageData = {
    navigation: NavItem[]
    hero: HeroData
    participation: ParticipationItem[]
    stats: StatItem[]
    timeline: TimelineItem[]
    news: NewsItem[]
    aboutParagraphs: string[]
    faq: FaqItem[]
    contacts: ContactsData
    footerColumns: FooterColumn[]
    socials: SocialLink[]
  }