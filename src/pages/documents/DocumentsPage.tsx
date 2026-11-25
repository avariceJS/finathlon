import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'

import type { DocumentItem } from '@/entities/document'
import { safeDocumentLink } from '@/entities/document/link'
import {
  documentsApi,
  documentSectionsApi,
  siteSettingsApi,
  type ContactsSetting,
  type DocumentSection,
} from '@/shared/api'
import { DEFAULT_CONTACTS_SETTING } from '@/shared/api/site-settings'
import { cx } from '@/shared/lib/classNames'
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
  reports: 'Отчёты',
}

function DocumentCard({ item }: { item: DocumentItem }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const href = safeDocumentLink(item.fileUrl)

  async function download() {
    if (!item.filePath || loading) return
    setLoading(true)
    setError(null)
    try {
      const result = await documentsApi.createDocumentDownload(
        item.filePath,
        item.fileName,
      )
      if (!result.data) {
        setError('Файл сейчас недоступен. Попробуйте ещё раз.')
        return
      }
      window.location.assign(result.data)
    } catch {
      setError('Файл сейчас недоступен. Попробуйте ещё раз.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <article className={cx(styles.card, item.source && styles[item.source])}>
      {item.source ? (
        <span className={styles.source}>
          {item.source === 'olympiad' ? 'Финатлон' : 'РСОШ'}
        </span>
      ) : null}
      <h3 className={styles.cardTitle}>{item.title}</h3>
      {item.description ? (
        <p className={styles.cardDescription}>{item.description}</p>
      ) : null}
      {item.filePath ? (
        <Button
          onClick={() => void download()}
          loading={loading}
          variant="ghost"
          size="sm"
        >
          Скачать
        </Button>
      ) : href ? (
        <Button
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          variant="ghost"
          size="sm"
        >
          Открыть
        </Button>
      ) : (
        <span className={styles.muted}>Файл скоро появится</span>
      )}
      {error ? <Alert variant="error">{error}</Alert> : null}
    </article>
  )
}

export function DocumentsPage() {
  const { hash, key } = useLocation()
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [sections, setSections] = useState<DocumentSection[]>([])
  const [contacts, setContacts] = useState<ContactsSetting>(
    DEFAULT_CONTACTS_SETTING,
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<{
    key: string
    items: Record<string, boolean>
  }>({ key, items: {} })
  const targetElement = useRef<HTMLElement>(null)
  const target = sections.find((section) => section.slug === hash.slice(1))
  const openPath = new Set<string>()
  let section = target
  while (section && !openPath.has(section.id)) {
    openPath.add(section.id)
    section = sections.find((candidate) => candidate.id === section?.parentId)
  }

  useEffect(() => {
    let cancelled = false
    Promise.all([
      documentsApi.listDocuments(),
      documentSectionsApi.listDocumentSections(),
      siteSettingsApi.fetchSiteSettings(),
    ])
      .then(([docsRes, sectionsRes, settingsRes]) => {
        if (cancelled) return
        setDocuments(docsRes.data ?? [])
        setSections(sectionsRes.data ?? [])
        if (settingsRes.data) setContacts(settingsRes.data.contacts)
        setError(docsRes.error ?? sectionsRes.error)
      })
      .catch((cause: unknown) => {
        if (!cancelled)
          setError(
            cause instanceof Error
              ? cause.message
              : 'Не удалось загрузить документы.',
          )
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (isLoading || !target || !targetElement.current) return
    targetElement.current.scrollIntoView({ block: 'start' })
  }, [isLoading, key, target])

  const roots = sections.filter((section) => !section.parentId)
  const legacy = new Map<string, DocumentItem[]>()
  for (const item of documents) {
    if (item.sectionId !== null) continue
    const group = legacy.get(item.category) ?? []
    group.push(item)
    legacy.set(item.category, group)
  }
  const overrides = expanded.key === key ? expanded.items : {}

  function renderSection(section: DocumentSection, depth: number) {
    const children =
      depth < 3
        ? sections.filter((candidate) => candidate.parentId === section.id)
        : []
    const items = documents.filter((item) => item.sectionId === section.id)
    const hasContent = children.length > 0 || items.length > 0
    const isOpen = overrides[section.id] ?? openPath.has(section.id)
    const panelId = `section-content-${section.slug}`

    return (
      <section
        key={section.id}
        ref={section.id === target?.id ? targetElement : undefined}
        id={`section-${section.slug}`}
        className={styles.sectionBlock}
      >
        <h2 className={styles.sectionTitle}>
          {hasContent ? (
            <button
              type="button"
              className={styles.sectionHeader}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() =>
                setExpanded({
                  key,
                  items: { ...overrides, [section.id]: !isOpen },
                })
              }
            >
              {section.title}
              <span className={styles.toggleIcon} aria-hidden="true">
                {isOpen ? '−' : '+'}
              </span>
            </button>
          ) : (
            <span className={styles.sectionHeader}>{section.title}</span>
          )}
        </h2>
        {hasContent && (
          <div id={panelId} className={styles.sectionContent} hidden={!isOpen}>
            {isOpen && (
              <>
                {items.length > 0 && (
                  <div className={styles.grid}>
                    {items.map((item) => (
                      <DocumentCard key={item.id} item={item} />
                    ))}
                  </div>
                )}
                {children.map((child) => renderSection(child, depth + 1))}
              </>
            )}
          </div>
        )}
      </section>
    )
  }

  return (
    <PageLayout header={<Header />} footer={<Footer contacts={contacts} />}>
      <PageHeader
        eyebrow="Документы"
        title="Документация Финатлона"
        description="Положения, регламенты и методические материалы для участников и наставников."
      />
      <Container>
        {error && (
          <Alert variant="error" title="Ошибка загрузки">
            {error}
          </Alert>
        )}
        {isLoading ? (
          <Spinner label="Загружаем документы..." />
        ) : roots.length === 0 && legacy.size === 0 && !error ? (
          <EmptyState
            title="Документы появятся скоро"
            description="Администраторы добавят материалы для скачивания."
          />
        ) : (
          <div className={styles.tree}>
            {roots.map((root) => renderSection(root, 1))}
            {[...legacy].map(([category, items]) => (
              <section key={category} className={styles.group}>
                <h2 className={styles.groupTitle}>
                  {CATEGORY_LABELS[category] ?? category}
                </h2>
                <div className={styles.grid}>
                  {items.map((item) => (
                    <DocumentCard key={item.id} item={item} />
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
