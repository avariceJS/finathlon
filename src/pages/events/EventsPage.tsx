import { useEffect, useState } from 'react'

import type { Program } from '@/entities/program'
import type { TimelineEvent } from '@/entities/timeline'
import {
  programsApi,
  siteSettingsApi,
  timelineApi,
  type ContactsSetting,
} from '@/shared/api'
import { DEFAULT_CONTACTS_SETTING } from '@/shared/api/site-settings'
import { Alert } from '@/shared/ui/alert/Alert'
import { Container } from '@/shared/ui/container/Container'
import { EmptyState } from '@/shared/ui/empty-state/EmptyState'
import { PageHeader } from '@/shared/ui/page-header/PageHeader'
import { PageLayout } from '@/shared/ui/page-layout/PageLayout'
import { Spinner } from '@/shared/ui/spinner/Spinner'
import { Footer } from '@/widgets/footer'
import { Header } from '@/widgets/header'
import { ProgramsSection } from '@/widgets/programs'
import { TimelineSection } from '@/widgets/timeline'

export function EventsPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [contacts, setContacts] = useState<ContactsSetting>(
    DEFAULT_CONTACTS_SETTING,
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    Promise.all([
      programsApi.listPrograms(),
      timelineApi.listTimeline(),
      siteSettingsApi.fetchSiteSettings(),
    ])
      .then(([programsRes, timelineRes, settingsRes]) => {
        if (cancelled) return
        setPrograms(programsRes.data ?? [])
        setTimeline(timelineRes.data ?? [])
        if (settingsRes.data) setContacts(settingsRes.data.contacts)
        setError(programsRes.error ?? timelineRes.error ?? settingsRes.error)
        setIsLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : String(err))
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <PageLayout header={<Header />} footer={<Footer contacts={contacts} />}>
      <PageHeader
        eyebrow="Мероприятия"
        title="Олимпиада, викторина и форум"
        description="Финатлон объединяет три формата: для школьников, старшеклассников и студентов. Выбирайте подходящее направление и подавайте заявку."
      />

      <Container>
        {error ? (
          <Alert variant="error" title="Ошибка загрузки">
            {error}
          </Alert>
        ) : null}
      </Container>

      {isLoading ? (
        <Container>
          <Spinner label="Загружаем мероприятия..." />
        </Container>
      ) : programs.length === 0 ? (
        <Container>
          <EmptyState
            title="Программы появятся скоро"
            description="Администраторы добавят мероприятия и они станут доступны здесь."
          />
        </Container>
      ) : (
        <>
          <ProgramsSection programs={programs} />
          <TimelineSection events={timeline} />
        </>
      )}
    </PageLayout>
  )
}
