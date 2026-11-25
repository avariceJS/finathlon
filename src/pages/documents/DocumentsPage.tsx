import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import type { DocumentItem } from '@/entities/document'
import { documentsApi, documentSectionsApi, siteSettingsApi, type ContactsSetting, type DocumentSection } from '@/shared/api'
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

export function DocumentsPage() {
  const { hash } = useLocation()
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [sections, setSections] = useState<DocumentSection[]>([])
  const [contacts, setContacts] = useState<ContactsSetting>(DEFAULT_CONTACTS_SETTING)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let cancelled = false
    Promise.all([
      documentsApi.listDocuments(),
      documentSectionsApi.listDocumentSections(),
      siteSettingsApi.fetchSiteSettings(),
    ]).then(([docsRes, sectionsRes, settingsRes]) => {
      if (cancelled) return
      setDocuments(docsRes.data ?? [])
      setSections(sectionsRes.data ?? [])
      if (settingsRes.data) setContacts(settingsRes.data.contacts)
      setError(docsRes.error ?? sectionsRes.error ?? settingsRes.error)
      setIsLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
  if (!hash || sections.length === 0) return

  const targetSlug = hash.replace('#', '')
  const targetSection = sections.find(s => s.slug === targetSlug)
  
  if (targetSection) {
    const sectionsToOpen: Record<string, boolean> = {}
    
    // Рекурсивно открываем всех родителей (вверх по дереву)
    const openAncestors = (id: string) => {
      const current = sections.find(s => s.id === id)
      if (!current) return
      
      // Открываем текущий раздел
      sectionsToOpen[current.id] = true
      
      // Если у него есть родитель, идем выше
      if (current.parentId) {
        openAncestors(current.parentId)
      }
    }
    
    openAncestors(targetSection.id)
    setOpenSections(prev => ({ ...prev, ...sectionsToOpen }))
    
    // Прокрутка к элементу (с учетом высоты шапки)
    setTimeout(() => {
      const element = document.getElementById(`section-${targetSection.slug}`)
      if (element) {
        const headerOffset = 100; // Высота шапки + отступ
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    }, 100)
  }
}, [hash, sections])

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const rootSections = sections.filter(s => !s.parentId)
  
  const renderSection = (section: DocumentSection, level = 0) => {
    const childSections = sections.filter(s => s.parentId === section.id)
    const sectionDocs = documents.filter(d => d.sectionId === section.id)
    const hasContent = childSections.length > 0 || sectionDocs.length > 0
    const isOpen = openSections[section.id] || false

    return (
      <div 
        key={section.id} 
        id={`section-${section.slug}`} 
        className={styles.sectionBlock} 
        style={{ 
        marginLeft: level > 0 ? '24px' : '0', 
        marginTop: level > 0 ? '8px' : '0',
        // Добавляем цветную полоску слева для заголовков, чтобы они не сливались
        borderLeft: level > 0 ? '3px solid #4f9cf9' : 'none',
        paddingLeft: level > 0 ? '12px' : '0'
      }}
      >
        <button 
          className={styles.sectionHeader} 
          onClick={() => hasContent && toggleSection(section.id)}
        >
          <h3 className={styles.sectionTitle}>
            {section.title}
          </h3>
          {hasContent && <span className={styles.toggleIcon}>{isOpen ? '−' : '+'}</span>}
        </button>
        
        {isOpen && (
          <div className={styles.sectionContent}>
            {sectionDocs.length > 0 && (
              <div className={styles.docsGrid}>
                {sectionDocs.map(doc => {
                  let cardStyle: React.CSSProperties = {}
                  let badge = null
                  
                  if (doc.source === 'olympiad') {
                    cardStyle = { borderLeft: '4px solid #2563eb' }
                    badge = <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600, marginBottom: '4px', display: 'block' }}>Финатлон</span>
                  } else if (doc.source === 'rsosh') {
                    cardStyle = { borderLeft: '4px solid #059669' }
                    badge = <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600, marginBottom: '4px', display: 'block' }}>РСОШ</span>
                  }

                  return (
                    <article key={doc.id} className={styles.docCard} style={cardStyle}>
                      {badge}
                      <h4 className={styles.docTitle}>{doc.title}</h4>
                      {doc.description && <p className={styles.docDesc}>{doc.description}</p>}
                      {doc.fileUrl ? (
                        <div style={{ marginTop: 'auto' }}>
                          <Button href={doc.fileUrl} target="_blank" variant="ghost" size="sm">
                            Открыть
                          </Button>
                        </div>
                      ) : (
                        <span className={styles.muted}>Файл скоро появится</span>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
            {childSections.map(child => renderSection(child, level + 1))}
          </div>
        )}
      </div>
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
        {error && <Alert variant="error" title="Ошибка">{error}</Alert>}
        {isLoading ? (
          <Spinner label="Загружаем документы..." />
        ) : documents.length === 0 && sections.length === 0 ? (
          <EmptyState title="Документы появятся скоро" description="Администраторы добавят документы и они будут доступны для скачивания." />
        ) : (
          <div className={styles.tree}>
            {rootSections.map(root => renderSection(root))}
          </div>
        )}
      </Container>
    </PageLayout>
  )
}