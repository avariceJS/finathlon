import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router'

import type { NewsArticle } from '@/entities/news'
import {
  newsApi,
  siteSettingsApi,
  type ContactsSetting,
} from '@/shared/api'
import { DEFAULT_CONTACTS_SETTING } from '@/shared/api/site-settings'
import { formatDate } from '@/shared/lib/format'
import { Alert } from '@/shared/ui/alert/Alert'
import { Button } from '@/shared/ui/button/Button'
import { Container } from '@/shared/ui/container/Container'
import { EmptyState } from '@/shared/ui/empty-state/EmptyState'
import { PageLayout } from '@/shared/ui/page-layout/PageLayout'
import { Spinner } from '@/shared/ui/spinner/Spinner'
import { Footer } from '@/widgets/footer'
import { Header } from '@/widgets/header'

import styles from './NewsDetailPage.module.css'

export function NewsDetailPage() {
  const { slug } = useParams()
  const [article, setArticle] = useState<NewsArticle | null>(null)
  const [contacts, setContacts] = useState<ContactsSetting>(
    DEFAULT_CONTACTS_SETTING,
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    setIsLoading(true)
    setError(null)

    Promise.all([
      newsApi.getNewsBySlug(slug),
      siteSettingsApi.fetchSiteSettings(),
    ])
      .then(([newsRes, settingsRes]) => {
        if (cancelled) return
        setArticle(newsRes.data)
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
  }, [slug])

  return (
    <PageLayout header={<Header />} footer={<Footer contacts={contacts} />}>
      <Container>
        <div className={styles.breadcrumbs}>
          <Link to="/news">← Все новости</Link>
        </div>

        {error ? (
          <Alert variant="error" title="Ошибка">
            {error}
          </Alert>
        ) : null}

        {isLoading ? (
          <Spinner label="Загружаем материал..." />
        ) : !article ? (
          <EmptyState
            title="Новость не найдена"
            description="Возможно, материал ещё не опубликован или ссылка устарела."
            actions={<Button to="/news">К списку новостей</Button>}
          />
        ) : (
          <article className={styles.article}>
            <header className={styles.head}>
              <p className={styles.date}>{formatDate(article.publishedAt)}</p>
              <h1 className={styles.title}>{article.title}</h1>
              {article.summary ? (
                <p className={styles.summary}>{article.summary}</p>
              ) : null}
              {article.authorName ? (
                <p className={styles.author}>Автор: {article.authorName}</p>
              ) : null}
            </header>

            {article.coverUrl ? (
              <img
                src={article.coverUrl}
                alt=""
                className={styles.cover}
              />
            ) : null}

            {article.content ? (
              <div className={styles.body}>
                {article.content.split(/\n\n+/).map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            ) : null}
          </article>
        )}
      </Container>
    </PageLayout>
  )
}
