import { useEffect, useState } from 'react'

import type { DocumentItem } from '@/entities/document'
import { documentsApi } from '@/shared/api'
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
  | { kind: 'create' }
  | { kind: 'edit'; doc: DocumentItem }

type FormState = {
  title: string
  description: string
  category: string
  fileUrl: string
  sortOrder: number
  isPublished: boolean
}

const EMPTY: FormState = {
  title: '',
  description: '',
  category: 'general',
  fileUrl: '',
  sortOrder: 0,
  isPublished: true,
}

const CATEGORIES = [
  { value: 'general', label: 'Общие документы' },
  { value: 'regulations', label: 'Положения и регламенты' },
  { value: 'guides', label: 'Методические материалы' },
  { value: 'reports', label: 'Отчётность' },
]

export function AdminDocumentsPage() {
  const [docs, setDocs] = useState<DocumentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>({ kind: 'closed' })
  const [form, setForm] = useState<FormState>(EMPTY)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const reload = async () => {
    setIsLoading(true)
    setError(null)
    const res = await documentsApi.listDocuments({ includeUnpublished: true })
    setDocs(res.data ?? [])
    setError(res.error)
    setIsLoading(false)
  }

  useEffect(() => {
    void reload()
  }, [])

  const openCreate = () => {
    setForm(EMPTY)
    setFormError(null)
    setMode({ kind: 'create' })
  }

  const openEdit = (doc: DocumentItem) => {
    setForm({
      title: doc.title,
      description: doc.description,
      category: doc.category,
      fileUrl: doc.fileUrl ?? '',
      sortOrder: doc.sortOrder,
      isPublished: doc.isPublished,
    })
    setFormError(null)
    setMode({ kind: 'edit', doc })
  }

  const closeModal = () => setMode({ kind: 'closed' })

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    setFormError(null)
    const payload = {
      title: form.title.trim(),
      description: form.description,
      category: form.category,
      fileUrl: form.fileUrl.trim() || null,
      sortOrder: form.sortOrder,
      isPublished: form.isPublished,
    }
    const result =
      mode.kind === 'create'
        ? await documentsApi.createDocument(payload)
        : mode.kind === 'edit'
          ? await documentsApi.updateDocument(mode.doc.id, payload)
          : { error: 'Неизвестное действие' as string | null, data: null }
    setIsSaving(false)
    if (result.error) {
      setFormError(result.error)
      return
    }
    closeModal()
    await reload()
  }

  const handleDelete = async (doc: DocumentItem) => {
    if (!confirm(`Удалить «${doc.title}»?`)) return
    const res = await documentsApi.deleteDocument(doc.id)
    if (res.error) {
      setError(res.error)
      return
    }
    await reload()
  }

  return (
    <AdminLayout
      title="Документы"
      description="Файлы и регламенты, доступные на странице /documents."
      actions={<Button onClick={openCreate}>+ Документ</Button>}
    >
      {error ? (
        <Alert variant="error" title="Ошибка">
          {error}
        </Alert>
      ) : null}

      {isLoading ? (
        <Spinner label="Загружаем..." />
      ) : (
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
              key: 'category',
              header: 'Категория',
              render: (item) =>
                CATEGORIES.find((c) => c.value === item.category)?.label ??
                item.category,
              width: '220px',
            },
            {
              key: 'order',
              header: '#',
              render: (item) => item.sortOrder,
              width: '60px',
              align: 'center',
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
              width: '140px',
            },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: (item) => (
                <div className={styles.rowActions}>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(item)}>
                    Редактировать
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(item)}
                  >
                    Удалить
                  </Button>
                </div>
              ),
              width: '240px',
            },
          ]}
        />
      )}

      <Modal isOpen={mode.kind !== 'closed'} onClose={closeModal}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <h2 className={styles.formTitle}>
            {mode.kind === 'create' ? 'Новый документ' : 'Редактировать'}
          </h2>

          {formError ? <Alert variant="error">{formError}</Alert> : null}

          <TextField
            label="Название"
            required
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          />
          <TextField
            multiline
            label="Описание"
            value={form.description}
            onChange={(e) =>
              setForm((p) => ({ ...p, description: e.target.value }))
            }
            rows={4}
          />
          <div className={styles.grid2}>
            <Select
              label="Категория"
              value={form.category}
              onChange={(e) =>
                setForm((p) => ({ ...p, category: e.target.value }))
              }
              options={CATEGORIES}
            />
            <TextField
              label="Ссылка на файл"
              value={form.fileUrl}
              onChange={(e) =>
                setForm((p) => ({ ...p, fileUrl: e.target.value }))
              }
              placeholder="https://"
            />
          </div>
          <div className={styles.grid2}>
            <TextField
              type="number"
              label="Порядок"
              value={String(form.sortOrder)}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  sortOrder: Number(e.target.value) || 0,
                }))
              }
            />
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) =>
                  setForm((p) => ({ ...p, isPublished: e.target.checked }))
                }
              />
              <span>Опубликовано</span>
            </label>
          </div>

          <div className={styles.formActions}>
            <Button type="button" variant="ghost" onClick={closeModal}>
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
