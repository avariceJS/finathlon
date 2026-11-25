import { useEffect, useState } from 'react'
import type { DocumentItem } from '@/entities/document'
import { documentsApi, documentSectionsApi, type DocumentSection } from '@/shared/api'
import { supabase } from '@/shared/supabase'
import { Alert } from '@/shared/ui/alert/Alert'
import { Button } from '@/shared/ui/button/Button'
import { Modal } from '@/shared/ui/modal/Modal'
import { Select } from '@/shared/ui/select/Select'
import { Spinner } from '@/shared/ui/spinner/Spinner'
import { TextField } from '@/shared/ui/text-field/TextField'
import { AdminLayout } from '@/widgets/admin-layout'
import { AdminTable } from '@/widgets/admin-table'
import styles from './admin-form.module.css'

type Mode = 
  | { kind: 'closed' } 
  | { kind: 'create-doc' } 
  | { kind: 'edit-doc'; doc: DocumentItem }
  | { kind: 'create-section' }
  | { kind: 'edit-section'; section: DocumentSection }

type DocForm = {
  title: string
  description: string
  sectionId: string
  fileUrl: string
  fileName: string
  source: 'olympiad' | 'rsosh' | '' 
  sortOrder: number
  isPublished: boolean
}

type SectionForm = {
  title: string
  slug: string
  parentId: string
  sortOrder: number
  isPublished: boolean
}

const EMPTY_DOC: DocForm = { 
  title: '', 
  description: '', 
  sectionId: '', 
  fileUrl: '', 
  fileName: '', 
  source: '', 
  sortOrder: 0, 
  isPublished: true 
}

const EMPTY_SECTION: SectionForm = { title: '', slug: '', parentId: '', sortOrder: 0, isPublished: true }

export function AdminDocumentsPage() {
  const [activeTab, setActiveTab] = useState<'docs' | 'sections'>('docs')
  const [docs, setDocs] = useState<DocumentItem[]>([])
  const [sections, setSections] = useState<DocumentSection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [mode, setMode] = useState<Mode>({ kind: 'closed' })
  const [docForm, setDocForm] = useState<DocForm>(EMPTY_DOC)
  const [sectionForm, setSectionForm] = useState<SectionForm>(EMPTY_SECTION)
  const [isSaving, setIsSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const reload = async () => {
    setIsLoading(true)
    const [docsRes, sectionsRes] = await Promise.all([
      documentsApi.listDocuments({ includeUnpublished: true }),
      documentSectionsApi.listDocumentSections({ includeUnpublished: true }),
    ])
    setDocs(docsRes.data ?? [])
    setSections(sectionsRes.data ?? [])
    setError(docsRes.error ?? sectionsRes.error)
    setIsLoading(false)
  }

  useEffect(() => { void reload() }, [])

  const closeModal = () => setMode({ kind: 'closed' })
  
  // --- Загрузка файла ---
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file)
      
    if (uploadError) {
      setFormError('Ошибка загрузки: ' + uploadError.message)
      setUploading(false)
      return
    }
    
    const { data } = supabase.storage.from('documents').getPublicUrl(fileName)
    setDocForm(prev => ({ ...prev, fileUrl: data.publicUrl, fileName: file.name }))
    setUploading(false)
  }

  // --- Обработчики для документов ---
  const openCreateDoc = () => {
    setDocForm(EMPTY_DOC)
    setMode({ kind: 'create-doc' })
  }

  const openEditDoc = (doc: DocumentItem) => {
    setDocForm({
      title: doc.title,
      description: doc.description,
      sectionId: doc.sectionId ?? '',
      fileUrl: doc.fileUrl ?? '',
      fileName: doc.fileName ?? '',
      source: doc.source ?? '',
      sortOrder: doc.sortOrder,
      isPublished: doc.isPublished,
    })
    setMode({ kind: 'edit-doc', doc })
  }

  const handleDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    const payload = {
      title: docForm.title.trim(),
      description: docForm.description,
      category: 'general',
      sectionId: docForm.sectionId || null,
      fileUrl: docForm.fileUrl.trim() || null,
      fileName: docForm.fileName || null,
      source: docForm.source || null,
      sortOrder: docForm.sortOrder,
      isPublished: docForm.isPublished,
    }
    const result = mode.kind === 'create-doc'
      ? await documentsApi.createDocument(payload)
      : await documentsApi.updateDocument((mode as any).doc.id, payload)
    setIsSaving(false)
    if (result.error) { setFormError(result.error); return }
    closeModal(); await reload()
  }

  // --- Обработчики для разделов  ---
  const openCreateSection = () => {
    setSectionForm(EMPTY_SECTION)
    setMode({ kind: 'create-section' })
  }

  const openEditSection = (section: DocumentSection) => {
    setSectionForm({
      title: section.title,
      slug: section.slug,
      parentId: section.parentId ?? '',
      sortOrder: section.sortOrder,
      isPublished: section.isPublished,
    })
    setMode({ kind: 'edit-section', section })
  }

  const handleSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    const payload = {
      title: sectionForm.title.trim(),
      slug: sectionForm.slug.trim(),
      parentId: sectionForm.parentId || null,
      sortOrder: sectionForm.sortOrder,
      isPublished: sectionForm.isPublished,
    }
    const result = mode.kind === 'create-section'
      ? await documentSectionsApi.createDocumentSection(payload)
      : await documentSectionsApi.updateDocumentSection((mode as any).section.id, payload)
    setIsSaving(false)
    if (result.error) { setFormError(result.error); return }
    closeModal(); await reload()
  }

  const handleDeleteDoc = async (doc: DocumentItem) => {
    if (!confirm(`Удалить «${doc.title}»?`)) return
    await documentsApi.deleteDocument(doc.id); await reload()
  }

  const handleDeleteSection = async (section: DocumentSection) => {
    if (!confirm(`Удалить раздел «${section.title}»?`)) return
    await documentSectionsApi.deleteDocumentSection(section.id); await reload()
  }

  return (
    <AdminLayout
      title="Документы"
      description="Управление файлами и структурой меню."
      actions={
        <div style={{ display: 'flex', gap: '8px' }}>
          {activeTab === 'docs' ? (
            <Button onClick={openCreateDoc}>+ Документ</Button>
          ) : (
            <Button onClick={openCreateSection}>+ Раздел</Button>
          )}
        </div>
      }
    >
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid #eef2f7' }}>
        <button 
          onClick={() => setActiveTab('docs')} 
          style={{ padding: '12px', fontWeight: activeTab === 'docs' ? 700 : 400, borderBottom: activeTab === 'docs' ? '2px solid #4f9cf9' : 'none' }}
        >
          Документы
        </button>
        <button 
          onClick={() => setActiveTab('sections')} 
          style={{ padding: '12px', fontWeight: activeTab === 'sections' ? 700 : 400, borderBottom: activeTab === 'sections' ? '2px solid #4f9cf9' : 'none' }}
        >
          Разделы меню
        </button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {isLoading ? <Spinner /> : activeTab === 'docs' ? (
        <AdminTable
          data={docs}
          rowKey={(item) => item.id}
          columns={[
            { key: 'title', header: 'Название', render: (item) => <strong>{item.title}</strong> },
            { key: 'section', header: 'Раздел', render: (item) => sections.find(s => s.id === item.sectionId)?.title ?? '—' },
            { key: 'source', header: 'Источник', render: (item) => {
              if (item.source === 'olympiad') return <span style={{ color: '#2563eb', fontWeight: 600 }}>Финатлон</span>
              if (item.source === 'rsosh') return <span style={{ color: '#059669', fontWeight: 600 }}>РСОШ</span>
              return '—'
            }}, 
            { key: 'status', header: 'Статус', render: (item) => <span className={item.isPublished ? styles.badgeOk : styles.badgeMuted}>{item.isPublished ? 'Опубликовано' : 'Скрыто'}</span> },
            { key: 'actions', header: '', render: (item) => (
              <div className={styles.rowActions}>
                <Button size="sm" variant="ghost" onClick={() => openEditDoc(item)}>Редактировать</Button>
                <Button size="sm" variant="danger" onClick={() => handleDeleteDoc(item)}>Удалить</Button>
              </div>
            )},
          ]}
        />
      ) : (
        <AdminTable
          data={sections}
          rowKey={(item) => item.id}
          columns={[
            { key: 'title', header: 'Название', render: (item) => <strong>{item.title}</strong> },
            { key: 'parent', header: 'Родитель', render: (item) => sections.find(s => s.id === item.parentId)?.title ?? 'Корневой' },
            { key: 'order', header: '#', render: (item) => item.sortOrder, width: '60px' },
            { key: 'status', header: 'Статус', render: (item) => <span className={item.isPublished ? styles.badgeOk : styles.badgeMuted}>{item.isPublished ? 'Виден' : 'Скрыт'}</span> },
            { key: 'actions', header: '', render: (item) => (
              <div className={styles.rowActions}>
                <Button size="sm" variant="ghost" onClick={() => openEditSection(item)}>Редактировать</Button>
                <Button size="sm" variant="danger" onClick={() => handleDeleteSection(item)}>Удалить</Button>
              </div>
            )},
          ]}
        />
      )}

      {/* --- Модалка для документов --- */}
      <Modal isOpen={mode.kind === 'create-doc' || mode.kind === 'edit-doc'} onClose={closeModal}>
        <form className={styles.form} onSubmit={handleDocSubmit}>
          <h2 className={styles.formTitle}>{mode.kind === 'create-doc' ? 'Новый документ' : 'Редактировать документ'}</h2>
          {formError && <Alert variant="error">{formError}</Alert>}
          <TextField label="Название" required value={docForm.title} onChange={e => setDocForm(p => ({...p, title: e.target.value}))} />
          <TextField multiline label="Описание" value={docForm.description} onChange={e => setDocForm(p => ({...p, description: e.target.value}))} />
          
          <Select label="Раздел" value={docForm.sectionId} onChange={e => setDocForm(p => ({...p, sectionId: e.target.value}))}
            options={[{ value: '', label: 'Без раздела' }, ...sections.map(s => ({ value: s.id, label: s.title }))]} />

          <Select label="Источник" value={docForm.source} onChange={e => setDocForm(p => ({...p, source: e.target.value as any}))}
            options={[
              { value: '', label: 'Не указан' },
              { value: 'olympiad', label: 'Документ олимпиады' },
              { value: 'rsosh', label: 'Документ РСОШ' },
            ]} /> 
          
          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, color: '#475467', display: 'block', marginBottom: '6px' }}>Загрузить файл</label>
            <input type="file" onChange={handleFileUpload} disabled={uploading} />
            {uploading && <span style={{ fontSize: '12px', color: '#4f9cf9' }}>Загрузка...</span>}
            {docForm.fileUrl && <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px' }}>Файл прикреплен: {docForm.fileName || 'Ссылка'}</div>}
          </div>

          <TextField label="Ссылка на файл (если нет загрузки)" value={docForm.fileUrl} onChange={e => setDocForm(p => ({...p, fileUrl: e.target.value}))} placeholder="https://" />

          <div className={styles.grid2}>
            <TextField type="number" label="Порядок" value={String(docForm.sortOrder)} onChange={e => setDocForm(p => ({...p, sortOrder: Number(e.target.value)}))} />
            <label className={styles.toggle}><input type="checkbox" checked={docForm.isPublished} onChange={e => setDocForm(p => ({...p, isPublished: e.target.checked}))} /><span>Опубликован</span></label>
          </div>
          <div className={styles.formActions}>
            <Button type="button" variant="ghost" onClick={closeModal}>Отмена</Button>
            <Button type="submit" loading={isSaving}>Сохранить</Button>
          </div>
        </form>
      </Modal>

      {/* --- Модалка для разделов --- */}
      <Modal isOpen={mode.kind === 'create-section' || mode.kind === 'edit-section'} onClose={closeModal}>
        <form className={styles.form} onSubmit={handleSectionSubmit}>
          <h2 className={styles.formTitle}>{mode.kind === 'create-section' ? 'Новый раздел' : 'Редактировать раздел'}</h2>
          {formError && <Alert variant="error">{formError}</Alert>}
          <TextField label="Название" required value={sectionForm.title} onChange={e => setSectionForm(p => ({...p, title: e.target.value}))} />
          <TextField label="Slug (для ссылки)" required value={sectionForm.slug} onChange={e => setSectionForm(p => ({...p, slug: e.target.value}))} hint="латиница, без пробелов" />
          <Select label="Родительский раздел" value={sectionForm.parentId} onChange={e => setSectionForm(p => ({...p, parentId: e.target.value}))}
            options={[{ value: '', label: 'Корневой (верхний уровень)' }, ...sections.filter(s => s.id !== (mode as any).section?.id).map(s => ({ value: s.id, label: s.title }))]} />
          <div className={styles.grid2}>
            <TextField type="number" label="Порядок" value={String(sectionForm.sortOrder)} onChange={e => setSectionForm(p => ({...p, sortOrder: Number(e.target.value)}))} />
            <label className={styles.toggle}><input type="checkbox" checked={sectionForm.isPublished} onChange={e => setSectionForm(p => ({...p, isPublished: e.target.checked}))} /><span>Опубликован</span></label>
          </div>
          <div className={styles.formActions}>
            <Button type="button" variant="ghost" onClick={closeModal}>Отмена</Button>
            <Button type="submit" loading={isSaving}>Сохранить</Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  )
}