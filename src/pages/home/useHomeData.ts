import { useEffect, useState } from 'react'

import type { FaqEntry } from '@/entities/faq'
import type { NewsArticle } from '@/entities/news'
import type { Program } from '@/entities/program'
import type { StatItem } from '@/entities/stat'
import type { TimelineEvent } from '@/entities/timeline'
import {
  faqsApi,
  newsApi,
  programsApi,
  siteSettingsApi,
  statsApi,
  timelineApi,
  type AboutSetting,
  type ContactsSetting,
  type HeroSetting,
} from '@/shared/api'
import {
  DEFAULT_ABOUT_SETTING,
  DEFAULT_CONTACTS_SETTING,
  DEFAULT_HERO_SETTING,
} from '@/shared/api/site-settings'

export type HomePageData = {
  hero: HeroSetting
  about: AboutSetting
  contacts: ContactsSetting
  programs: Program[]
  stats: StatItem[]
  timeline: TimelineEvent[]
  faqs: FaqEntry[]
  news: NewsArticle[]
}

type State = {
  data: HomePageData
  isLoading: boolean
  error: string | null
}

const EMPTY_DATA: HomePageData = {
  hero: DEFAULT_HERO_SETTING,
  about: DEFAULT_ABOUT_SETTING,
  contacts: DEFAULT_CONTACTS_SETTING,
  programs: [],
  stats: [],
  timeline: [],
  faqs: [],
  news: [],
}

export function useHomeData(): State {
  const [state, setState] = useState<State>({
    data: EMPTY_DATA,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    Promise.all([
      siteSettingsApi.fetchSiteSettings(),
      programsApi.listPrograms(),
      statsApi.listStats(),
      timelineApi.listTimeline(),
      faqsApi.listFaqs(),
      newsApi.listNews({ limit: 6 }),
    ])
      .then(
        ([
          settingsRes,
          programsRes,
          statsRes,
          timelineRes,
          faqsRes,
          newsRes,
        ]) => {
          if (cancelled) return
          const firstError =
            settingsRes.error ??
            programsRes.error ??
            statsRes.error ??
            timelineRes.error ??
            faqsRes.error ??
            newsRes.error ??
            null

          setState({
            data: {
              hero: settingsRes.data?.hero ?? DEFAULT_HERO_SETTING,
              about: settingsRes.data?.about ?? DEFAULT_ABOUT_SETTING,
              contacts: settingsRes.data?.contacts ?? DEFAULT_CONTACTS_SETTING,
              programs: programsRes.data ?? [],
              stats: statsRes.data ?? [],
              timeline: timelineRes.data ?? [],
              faqs: faqsRes.data ?? [],
              news: newsRes.data ?? [],
            },
            isLoading: false,
            error: firstError,
          })
        },
      )
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : String(err)
        setState((prev) => ({ ...prev, isLoading: false, error: message }))
      })

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
