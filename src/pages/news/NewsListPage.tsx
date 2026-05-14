import { useEffect, useState } from 'react'

import type { NewsArticle } from '@/entities/news'
import {
  newsApi,
  siteSettingsApi,
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
import { NewsCard } from '@/widgets/news'

import styles from './NewsListPage.module.css'

export function NewsListPage() {
  const [news, setNews] = useState<NewsArticle[]>([])
  const [contacts, setContacts] = useState<ContactsSetting>(
    DEFAULT_CONTACTS_SETTING,
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    Promise.all([newsApi.listNews(), siteSettingsApi.fetchSiteSettings()])
      .then(([newsRes, settingsRes]) => {
        if (cancelled) return
        setNews(newsRes.data ?? [])
        if (settingsRes.data) setContacts(settingsRes.data.contacts)
        setError(newsRes.error ?? settingsRes.error)
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
        eyebrow="Новости"
        title="Свежие материалы Финатлона"
        description="Обновления по олимпиаде, расписание форума, аналитика и интервью с экспертами."
      />

      <Container>
        {error ? (
          <Alert variant="error" title="Ошибка загрузки">
            {error}
          </Alert>
        ) : null}

        {isLoading ? (
          <Spinner label="Загружаем новости..." />
        ) : news.length === 0 ? (
          <EmptyState
            title="Пока нет новостей"
            description="Заглядывайте позже — здесь появятся свежие материалы команды."
          />
        ) : (
          <div className={styles.grid}>
            {news.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </Container>
    </PageLayout>
  )
}
