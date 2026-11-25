import { useCallback, useEffect, useState } from 'react'
import type { DocumentItem } from '@/entities/document'
import { safeDocumentLink } from '@/entities/document/link'
import {
  documentsApi,
  documentSectionsApi,
  type DocumentSection,
} from '@/shared/api'
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
  filePath: string | null
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
  filePath: null,
  source: '',
  sortOrder: 0,
  isPublished: true,
}

const EMPTY_SECTION: SectionForm = {
  title: '',
  slug: '',
  parentId: '',
  sortOrder: 0,
  isPublished: true,
}

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setIsLoading(true)
    try {
      const [docsRes, sectionsRes] = await Promise.all([
        documentsApi.listDocuments({ includeUnpublished: true }),
        documentSectionsApi.listDocumentSections({ includeUnpublished: true }),
      ])
      setDocs(docsRes.data ?? [])
      setSections(sectionsRes.data ?? [])
      setError(docsRes.error ?? sectionsRes.error)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Не удалось загрузить документы.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const closeModal = () => {
    if (!isSaving) setMode({ kind: 'closed' })
  }

  function pickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    const suffix = file?.name.split('.').at(-1)?.toLowerCase()
    if (
      file &&
      (!['pdf', 'docx'].includes(suffix ?? '') ||
        !file.size ||
        file.size > 15 * 1024 * 1024)
    ) {
      setFormError('Выберите непустой PDF или DOCX размером до 15 МБ.')
      event.target.value = ''
      setSelectedFile(null)
      return
    }
    setFormError(null)
    setSelectedFile(file)
  }

  // --- Обработчики для документов ---
  const openCreateDoc = () => {
    setFormError(null)
    setSelectedFile(null)
    setDocForm(EMPTY_DOC)
    setMode({ kind: 'create-doc' })
  }

  const openEditDoc = (doc: DocumentItem) => {
    setFormError(null)
    setSelectedFile(null)
    setDocForm({
      title: doc.title,
      description: doc.description,
      sectionId: doc.sectionId ?? '',
      fileUrl: doc.fileUrl ?? '',
      fileName: doc.fileName ?? '',
      filePath: doc.filePath,
      source: doc.source ?? '',
      sortOrder: doc.sortOrder,
      isPublished: doc.isPublished,
    })
    setMode({ kind: 'edit-doc', doc })
  }

  const handleDocSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (isSaving || (mode.kind !== 'create-doc' && mode.kind !== 'edit-doc'))
      return
    const title = docForm.title.trim()
    const fileUrl = docForm.fileUrl.trim()
    const safeUrl = safeDocumentLink(fileUrl)
    if (!title || (fileUrl && !safeUrl && !selectedFile)) {
      setFormError(
        !title
          ? 'Укажите название документа.'
          : 'Укажите ссылку на файл по HTTP или HTTPS.',
      )
      return
    }
    setIsSaving(true)
    setFormError(null)
    try {
      let filePath = fileUrl ? null : docForm.filePath
      let fileName =
        !fileUrl || (mode.kind === 'edit-doc' && fileUrl === mode.doc.fileUrl)
          ? docForm.fileName || null
          : null
      if (selectedFile) {
        const ext = selectedFile.name.split('.').at(-1)?.toLowerCase()
        const contentType =
          ext === 'pdf'
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        filePath = `${crypto.randomUUID()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, selectedFile, { contentType })
        if (uploadError) {
          setFormError('Ошибка загрузки: ' + uploadError.message)
          return
        }
        fileName = selectedFile.name
        const savedPath = filePath
        setDocForm((current) => ({
          ...current,
          filePath: savedPath,
          fileName: selectedFile.name,
          fileUrl: '',
        }))
        setSelectedFile(null)
      }
      const payload = {
        title,
        description: docForm.description,
        sectionId: docForm.sectionId || null,
        fileUrl: filePath ? null : safeUrl,
        filePath,
        fileName,
        source: docForm.source || null,
        sortOrder: docForm.sortOrder,
        isPublished: docForm.isPublished,
      }
      const result =
        mode.kind === 'create-doc'
          ? await documentsApi.createDocument(payload)
          : await documentsApi.updateDocument(mode.doc.id, payload)
      if (result.error) {
        setFormError(result.error)
        return
      }
      setMode({ kind: 'closed' })
      await reload()
    } catch (cause) {
      setFormError(
        cause instanceof Error
          ? cause.message
          : 'Не удалось сохранить документ.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const openCreateSection = () => {
    setFormError(null)
    setSectionForm(EMPTY_SECTION)
    setMode({ kind: 'create-section' })
  }

  const openEditSection = (section: DocumentSection) => {
    setFormError(null)
    setSectionForm({
      title: section.title,
      slug: section.slug,
      parentId: section.parentId ?? '',
      sortOrder: section.sortOrder,
      isPublished: section.isPublished,
    })
    setMode({ kind: 'edit-section', section })
  }

  const handleSectionSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (
      isSaving ||
      (mode.kind !== 'create-section' && mode.kind !== 'edit-section')
    )
      return
    const title = sectionForm.title.trim()
    const slug = sectionForm.slug.trim()
    if (!title || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
      setFormError(
        'Укажите название и адрес раздела латиницей. Используйте цифры и дефисы.',
      )
      return
    }
    setIsSaving(true)
    setFormError(null)
    try {
      const payload = {
        title,
        slug,
        parentId: sectionForm.parentId || null,
        sortOrder: sectionForm.sortOrder,
        isPublished: sectionForm.isPublished,
      }
      const result =
        mode.kind === 'create-section'
          ? await documentSectionsApi.createDocumentSection(payload)
          : await documentSectionsApi.updateDocumentSection(
              mode.section.id,
              payload,
            )
      if (result.error) {
        setFormError(result.error)
        return
      }
      setMode({ kind: 'closed' })
      await reload()
    } catch (cause) {
      setFormError(
        cause instanceof Error ? cause.message : 'Не удалось сохранить раздел.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteDoc = async (doc: DocumentItem) => {
    if (!confirm(`Удалить «${doc.title}»?`)) return
    const result = await documentsApi.deleteDocument(doc.id)
    if (result.error) setError(result.error)
    else await reload()
  }

  const handleDeleteSection = async (section: DocumentSection) => {
    if (
      sections.some((item) => item.parentId === section.id) ||
      docs.some((doc) => doc.sectionId === section.id)
    ) {
      setError('Сначала перенесите документы и подразделы в другое место.')
      return
    }
    if (!confirm(`Удалить раздел «${section.title}»?`)) return
    const result = await documentSectionsApi.deleteDocumentSection(section.id)
    if (result.error) setError(result.error)
    else await reload()
  }

  const editedSectionId = mode.kind === 'edit-section' ? mode.section.id : null
  const parentOptions = sections.filter((section) => {
    const seen = new Set<string>()
    let parent: DocumentSection | undefined = section
    while (parent) {
      if (
        parent.id === editedSectionId ||
        seen.has(parent.id) ||
        seen.size >= 2
      )
        return false
      seen.add(parent.id)
      parent = sections.find((item) => item.id === parent?.parentId)
    }
    return true
  })

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
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          borderBottom: '1px solid #eef2f7',
        }}
      >
        <button
          onClick={() => setActiveTab('docs')}
          style={{
            padding: '12px',
            fontWeight: activeTab === 'docs' ? 700 : 400,
            borderBottom: activeTab === 'docs' ? '2px solid #4f9cf9' : 'none',
          }}
        >
          Документы
        </button>
        <button
          onClick={() => setActiveTab('sections')}
          style={{
            padding: '12px',
            fontWeight: activeTab === 'sections' ? 700 : 400,
            borderBottom:
              activeTab === 'sections' ? '2px solid #4f9cf9' : 'none',
          }}
        >
          Разделы меню
        </button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {isLoading ? (
        <Spinner />
      ) : activeTab === 'docs' ? (
        <AdminTable
          data={docs}
          rowKey={(item) => item.id}
          columns={[
            {
              key: 'title',
              header: 'Название',
              render: (item) => <strong>{item.title}</strong>,
            },
            {
              key: 'section',
              header: 'Раздел',
              render: (item) =>
                sections.find((s) => s.id === item.sectionId)?.title ?? '—',
            },
            {
              key: 'source',
              header: 'Источник',
              render: (item) => {
                if (item.source === 'olympiad')
                  return (
                    <span style={{ color: '#2563eb', fontWeight: 600 }}>
                      Финатлон
                    </span>
                  )
                if (item.source === 'rsosh')
                  return (
                    <span style={{ color: '#059669', fontWeight: 600 }}>
                      РСОШ
                    </span>
                  )
                return '—'
              },
            },
            {
              key: 'status',
              header: 'Статус',
              render: (item) => (
                <span
                  className={
                    item.isPublished ? styles.badgeOk : styles.badgeMuted
                  }
                >
                  {item.isPublished ? 'Опубликовано' : 'Скрыто'}
                </span>
              ),
            },
            {
              key: 'actions',
              header: '',
              render: (item) => (
                <div className={styles.rowActions}>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditDoc(item)}
                  >
                    Редактировать
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDeleteDoc(item)}
                  >
                    Удалить
                  </Button>
                </div>
              ),
            },
          ]}
        />
      ) : (
        <AdminTable
          data={sections}
          rowKey={(item) => item.id}
          columns={[
            {
              key: 'title',
              header: 'Название',
              render: (item) => <strong>{item.title}</strong>,
            },
            {
              key: 'parent',
              header: 'Родитель',
              render: (item) =>
                sections.find((s) => s.id === item.parentId)?.title ??
                'Корневой',
            },
            {
              key: 'order',
              header: '#',
              render: (item) => item.sortOrder,
              width: '60px',
            },
            {
              key: 'status',
              header: 'Статус',
              render: (item) => (
                <span
                  className={
                    item.isPublished ? styles.badgeOk : styles.badgeMuted
                  }
                >
                  {item.isPublished ? 'Виден' : 'Скрыт'}
                </span>
              ),
            },
            {
              key: 'actions',
              header: '',
              render: (item) => (
                <div className={styles.rowActions}>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditSection(item)}
                  >
                    Редактировать
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDeleteSection(item)}
                  >
                    Удалить
                  </Button>
                </div>
              ),
            },
          ]}
        />
      )}

      {/* --- Модалка для документов --- */}
      <Modal
        isOpen={mode.kind === 'create-doc' || mode.kind === 'edit-doc'}
        onClose={closeModal}
      >
        <form className={styles.form} onSubmit={handleDocSubmit}>
          <h2 className={styles.formTitle}>
            {mode.kind === 'create-doc'
              ? 'Новый документ'
              : 'Редактировать документ'}
          </h2>
          {formError && <Alert variant="error">{formError}</Alert>}
          <TextField
            label="Название"
            required
            value={docForm.title}
            onChange={(e) =>
              setDocForm((p) => ({ ...p, title: e.target.value }))
            }
          />
          <TextField
            multiline
            label="Описание"
            value={docForm.description}
            onChange={(e) =>
              setDocForm((p) => ({ ...p, description: e.target.value }))
            }
          />

          <Select
            label="Раздел"
            value={docForm.sectionId}
            onChange={(e) =>
              setDocForm((p) => ({ ...p, sectionId: e.target.value }))
            }
            options={[
              { value: '', label: 'Без раздела' },
              ...sections.map((s) => ({ value: s.id, label: s.title })),
            ]}
          />

          <Select
            label="Источник"
            value={docForm.source}
            onChange={(e) =>
              setDocForm((p) => ({
                ...p,
                source:
                  e.target.value === 'olympiad' || e.target.value === 'rsosh'
                    ? e.target.value
                    : '',
              }))
            }
            options={[
              { value: '', label: 'Не указан' },
              { value: 'olympiad', label: 'Документ олимпиады' },
              { value: 'rsosh', label: 'Документ РСОШ' },
            ]}
          />

          <div>
            <label htmlFor="document-file">
              Загрузить файл (PDF или DOCX, до 15 МБ)
            </label>
            <input
              id="document-file"
              type="file"
              accept=".pdf,.docx"
              onChange={pickFile}
              disabled={isSaving}
            />
            {selectedFile || docForm.filePath ? (
              <div>
                <p>
                  {selectedFile?.name ?? docForm.fileName ?? 'Файл прикреплён'}
                </p>
                <Button
                  disabled={isSaving}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null)
                    setDocForm((current) => ({
                      ...current,
                      fileName: '',
                      filePath: null,
                    }))
                    const input = document.getElementById('document-file')
                    if (input instanceof HTMLInputElement) input.value = ''
                  }}
                >
                  Убрать файл
                </Button>
              </div>
            ) : null}
          </div>
          <TextField
            label="Внешняя ссылка на документ"
            value={docForm.fileUrl}
            disabled={isSaving}
            onChange={(event) => {
              setSelectedFile(null)
              setDocForm((current) => ({
                ...current,
                fileUrl: event.target.value,
              }))
              const input = document.getElementById('document-file')
              if (input instanceof HTMLInputElement) input.value = ''
            }}
            placeholder="https://"
          />

          <div className={styles.grid2}>
            <TextField
              type="number"
              label="Порядок"
              value={String(docForm.sortOrder)}
              onChange={(e) =>
                setDocForm((p) => ({ ...p, sortOrder: Number(e.target.value) }))
              }
            />
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={docForm.isPublished}
                onChange={(e) =>
                  setDocForm((p) => ({ ...p, isPublished: e.target.checked }))
                }
              />
              <span>Опубликован</span>
            </label>
          </div>
          <div className={styles.formActions}>
            <Button
              type="button"
              disabled={isSaving}
              variant="ghost"
              onClick={closeModal}
            >
              Отмена
            </Button>
            <Button type="submit" loading={isSaving}>
              Сохранить
            </Button>
          </div>
        </form>
      </Modal>

      {/* --- Модалка для разделов --- */}
      <Modal
        isOpen={mode.kind === 'create-section' || mode.kind === 'edit-section'}
        onClose={closeModal}
      >
        <form className={styles.form} onSubmit={handleSectionSubmit}>
          <h2 className={styles.formTitle}>
            {mode.kind === 'create-section'
              ? 'Новый раздел'
              : 'Редактировать раздел'}
          </h2>
          {formError && <Alert variant="error">{formError}</Alert>}
          <TextField
            label="Название"
            required
            value={sectionForm.title}
            onChange={(e) =>
              setSectionForm((p) => ({ ...p, title: e.target.value }))
            }
          />
          <TextField
            label="Slug (для ссылки)"
            required
            value={sectionForm.slug}
            onChange={(e) =>
              setSectionForm((p) => ({ ...p, slug: e.target.value }))
            }
            hint="латиница, без пробелов"
          />
          <Select
            label="Родительский раздел"
            value={sectionForm.parentId}
            onChange={(e) =>
              setSectionForm((p) => ({ ...p, parentId: e.target.value }))
            }
            options={[
              { value: '', label: 'Корневой (верхний уровень)' },
              ...parentOptions.map((s) => ({ value: s.id, label: s.title })),
            ]}
          />
          <div className={styles.grid2}>
            <TextField
              type="number"
              label="Порядок"
              value={String(sectionForm.sortOrder)}
              onChange={(e) =>
                setSectionForm((p) => ({
                  ...p,
                  sortOrder: Number(e.target.value),
                }))
              }
            />
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={sectionForm.isPublished}
                onChange={(e) =>
                  setSectionForm((p) => ({
                    ...p,
                    isPublished: e.target.checked,
                  }))
                }
              />
              <span>Опубликован</span>
            </label>
          </div>
          <div className={styles.formActions}>
            <Button
              type="button"
              disabled={isSaving}
              variant="ghost"
              onClick={closeModal}
            >
              Отмена
            </Button>
            <Button type="submit" loading={isSaving}>
              Сохранить
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  )
}
