import { useEffect, useMemo, useState } from 'react'

import type { DocumentItem } from '@/entities/document'
import {
  documentsApi,
  siteSettingsApi,
  type ContactsSetting,
} from '@/shared/api'
import { DEFAULT_CONTACTS_SETTING } from '@/shared/api/site-settings'
import { Alert } from '@/shared/ui/alert/Alert'
import { Button } from '@/shared/ui/button/Button'
import { Container } from '@/shared/ui/container/Container'
import { EmptyState } from '@/shared/ui/empty-state/EmptyState'
import { PageHeader } from '@/shared/ui/page-header/PageHeader'
import { PageLayout } from '@/shared/ui/page-layout/PageLayout'
import { Spinner } from '@/shared/ui/spinner/Spinner'
import { Footer } from '@/widgets/footer'
import { Header } from '@/widgets/header'

import styles from './DocumentsPage.module.css'

const CATEGORY_LABELS: Record<string, string> = {
  general: 'Общие документы',
  regulations: 'Положения и регламенты',
  guides: 'Методические материалы',
  reports: 'Отчётность',
}

export function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [contacts, setContacts] = useState<ContactsSetting>(
    DEFAULT_CONTACTS_SETTING,
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    Promise.all([
      documentsApi.listDocuments(),
      siteSettingsApi.fetchSiteSettings(),
    ])
      .then(([docsRes, settingsRes]) => {
        if (cancelled) return
        setDocuments(docsRes.data ?? [])
        if (settingsRes.data) setContacts(settingsRes.data.contacts)
        setError(docsRes.error ?? settingsRes.error)
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

  const grouped = useMemo(() => {
    const byCategory = new Map<string, DocumentItem[]>()
    for (const item of documents) {
      const list = byCategory.get(item.category) ?? []
      list.push(item)
      byCategory.set(item.category, list)
    }
    return Array.from(byCategory.entries())
  }, [documents])

  return (
    <PageLayout header={<Header />} footer={<Footer contacts={contacts} />}>
      <PageHeader
        eyebrow="Документы"
        title="Документация Финатлона"
        description="Положения, регламенты и методические материалы для участников и наставников."
      />

      <Container>
        {error ? (
          <Alert variant="error" title="Ошибка">
            {error}
          </Alert>
        ) : null}

        {isLoading ? (
          <Spinner label="Загружаем документы..." />
        ) : documents.length === 0 ? (
          <EmptyState
            title="Документы появятся скоро"
            description="Администраторы добавят документы и они будут доступны для скачивания."
          />
        ) : (
          <div className={styles.groups}>
            {grouped.map(([category, items]) => (
              <section key={category} className={styles.group}>
                <h2 className={styles.groupTitle}>
                  {CATEGORY_LABELS[category] ?? category}
                </h2>
                <div className={styles.grid}>
                  {items.map((doc) => (
                    <article key={doc.id} className={styles.card}>
                      <h3 className={styles.cardTitle}>{doc.title}</h3>
                      {doc.description ? (
                        <p className={styles.cardDescription}>
                          {doc.description}
                        </p>
                      ) : null}
                      {doc.fileUrl ? (
                        <Button href={doc.fileUrl} variant="ghost" size="sm">
                          Скачать
                        </Button>
                      ) : (
                        <span className={styles.muted}>Файл скоро появится</span>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </Container>
    </PageLayout>
  )
}
