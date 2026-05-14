import { useEffect, useState } from 'react'

import type { TimelineAccent, TimelineEvent } from '@/entities/timeline'
import { timelineApi } from '@/shared/api'
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
  | { kind: 'edit'; event: TimelineEvent }

type FormState = {
  title: string
  dateLabel: string
  year: number
  accent: TimelineAccent
  sortOrder: number
  isPublished: boolean
}

const EMPTY: FormState = {
  title: '',
  dateLabel: '',
  year: new Date().getFullYear(),
  accent: 'red',
  sortOrder: 0,
  isPublished: true,
}

const ACCENTS = [
  { value: 'red', label: 'Красный' },
  { value: 'blue', label: 'Синий' },
  { value: 'green', label: 'Зелёный' },
  { value: 'orange', label: 'Оранжевый' },
]

export function AdminTimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>({ kind: 'closed' })
  const [form, setForm] = useState<FormState>(EMPTY)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const reload = async () => {
    setIsLoading(true)
    setError(null)
    const res = await timelineApi.listTimeline({ includeUnpublished: true })
    setEvents(res.data ?? [])
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

  const openEdit = (event: TimelineEvent) => {
    setForm({
      title: event.title,
      dateLabel: event.dateLabel,
      year: event.year,
      accent: event.accent,
      sortOrder: event.sortOrder,
      isPublished: event.isPublished,
    })
    setFormError(null)
    setMode({ kind: 'edit', event })
  }

  const closeModal = () => setMode({ kind: 'closed' })

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    setFormError(null)
    const payload = {
      title: form.title.trim(),
      dateLabel: form.dateLabel.trim(),
      year: form.year,
      accent: form.accent,
      sortOrder: form.sortOrder,
      isPublished: form.isPublished,
    }
    const result =
      mode.kind === 'create'
        ? await timelineApi.createTimelineEvent(payload)
        : mode.kind === 'edit'
          ? await timelineApi.updateTimelineEvent(mode.event.id, payload)
          : { error: 'Неизвестное действие' as string | null, data: null }
    setIsSaving(false)
    if (result.error) {
      setFormError(result.error)
      return
    }
    closeModal()
    await reload()
  }

  const handleDelete = async (event: TimelineEvent) => {
    if (!confirm(`Удалить событие «${event.title}»?`)) return
    const res = await timelineApi.deleteTimelineEvent(event.id)
    if (res.error) {
      setError(res.error)
      return
    }
    await reload()
  }

  return (
    <AdminLayout
      title="Таймлайн"
      description="События с датами для блока «Таймлайн» на главной."
      actions={<Button onClick={openCreate}>+ Событие</Button>}
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
          data={events}
          rowKey={(item) => item.id}
          columns={[
            {
              key: 'title',
              header: 'Название',
              render: (item) => <strong>{item.title}</strong>,
            },
            {
              key: 'date',
              header: 'Дата',
              render: (item) => `${item.dateLabel}, ${item.year}`,
              width: '220px',
            },
            {
              key: 'accent',
              header: 'Цвет',
              render: (item) =>
                ACCENTS.find((a) => a.value === item.accent)?.label ??
                item.accent,
              width: '120px',
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
            {mode.kind === 'create' ? 'Новое событие' : 'Редактировать событие'}
          </h2>
          {formError ? <Alert variant="error">{formError}</Alert> : null}

          <TextField
            label="Название"
            required
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          />
          <div className={styles.grid2}>
            <TextField
              label="Дата (текст)"
              required
              placeholder="23 апреля"
              value={form.dateLabel}
              onChange={(e) =>
                setForm((p) => ({ ...p, dateLabel: e.target.value }))
              }
            />
            <TextField
              type="number"
              label="Год"
              required
              value={String(form.year)}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  year: Number(e.target.value) || new Date().getFullYear(),
                }))
              }
            />
          </div>
          <div className={styles.grid2}>
            <Select
              label="Цвет акцента"
              value={form.accent}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  accent: e.target.value as TimelineAccent,
                }))
              }
              options={ACCENTS}
            />
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
          </div>
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
