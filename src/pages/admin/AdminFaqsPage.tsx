import { useEffect, useState } from 'react'

import type { FaqEntry } from '@/entities/faq'
import { faqsApi } from '@/shared/api'
import { Alert } from '@/shared/ui/alert/Alert'
import { Button } from '@/shared/ui/button/Button'
import { Modal } from '@/shared/ui/modal/Modal'
import { Spinner } from '@/shared/ui/spinner/Spinner'
import { TextField } from '@/shared/ui/text-field/TextField'
import { AdminLayout } from '@/widgets/admin-layout'
import { AdminTable } from '@/widgets/admin-table'

import styles from './admin-form.module.css'

type Mode =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; entry: FaqEntry }

type FormState = {
  question: string
  answer: string
  sortOrder: number
  isPublished: boolean
}

const EMPTY: FormState = {
  question: '',
  answer: '',
  sortOrder: 0,
  isPublished: true,
}

export function AdminFaqsPage() {
  const [items, setItems] = useState<FaqEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>({ kind: 'closed' })
  const [form, setForm] = useState<FormState>(EMPTY)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const reload = async () => {
    setIsLoading(true)
    setError(null)
    const res = await faqsApi.listFaqs({ includeUnpublished: true })
    setItems(res.data ?? [])
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

  const openEdit = (entry: FaqEntry) => {
    setForm({
      question: entry.question,
      answer: entry.answer,
      sortOrder: entry.sortOrder,
      isPublished: entry.isPublished,
    })
    setFormError(null)
    setMode({ kind: 'edit', entry })
  }

  const closeModal = () => setMode({ kind: 'closed' })

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    setFormError(null)
    const payload = {
      question: form.question.trim(),
      answer: form.answer,
      sortOrder: form.sortOrder,
      isPublished: form.isPublished,
    }
    const result =
      mode.kind === 'create'
        ? await faqsApi.createFaq(payload)
        : mode.kind === 'edit'
          ? await faqsApi.updateFaq(mode.entry.id, payload)
          : { error: 'Неизвестное действие' as string | null, data: null }
    setIsSaving(false)
    if (result.error) {
      setFormError(result.error)
      return
    }
    closeModal()
    await reload()
  }

  const handleDelete = async (entry: FaqEntry) => {
    if (!confirm(`Удалить вопрос?`)) return
    const res = await faqsApi.deleteFaq(entry.id)
    if (res.error) {
      setError(res.error)
      return
    }
    await reload()
  }

  return (
    <AdminLayout
      title="FAQ"
      description="Часто задаваемые вопросы на главной странице."
      actions={<Button onClick={openCreate}>+ Вопрос</Button>}
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
          data={items}
          rowKey={(item) => item.id}
          columns={[
            {
              key: 'question',
              header: 'Вопрос',
              render: (item) => <strong>{item.question}</strong>,
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
            {mode.kind === 'create' ? 'Новый вопрос' : 'Редактировать'}
          </h2>
          {formError ? <Alert variant="error">{formError}</Alert> : null}

          <TextField
            label="Вопрос"
            required
            value={form.question}
            onChange={(e) =>
              setForm((p) => ({ ...p, question: e.target.value }))
            }
          />
          <TextField
            multiline
            label="Ответ"
            required
            value={form.answer}
            onChange={(e) =>
              setForm((p) => ({ ...p, answer: e.target.value }))
            }
            rows={6}
          />
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
