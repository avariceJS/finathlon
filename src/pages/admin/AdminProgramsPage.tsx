import { useEffect, useState } from 'react'

import type { Program } from '@/entities/program'
import { programsApi } from '@/shared/api'
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
  | { kind: 'edit'; program: Program }

type FormState = {
  slug: string
  title: string
  summary: string
  description: string
  highlights: string
  ctaLabel: string
  ctaHref: string
  sortOrder: number
  isPublished: boolean
}

const EMPTY: FormState = {
  slug: '',
  title: '',
  summary: '',
  description: '',
  highlights: '',
  ctaLabel: 'Участвовать',
  ctaHref: '',
  sortOrder: 0,
  isPublished: true,
}

export function AdminProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>({ kind: 'closed' })
  const [form, setForm] = useState<FormState>(EMPTY)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const reload = async () => {
    setIsLoading(true)
    setError(null)
    const res = await programsApi.listPrograms({ includeUnpublished: true })
    setPrograms(res.data ?? [])
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

  const openEdit = (program: Program) => {
    setForm({
      slug: program.slug,
      title: program.title,
      summary: program.summary,
      description: program.description,
      highlights: program.highlights.join('\n'),
      ctaLabel: program.ctaLabel,
      ctaHref: program.ctaHref ?? '',
      sortOrder: program.sortOrder,
      isPublished: program.isPublished,
    })
    setFormError(null)
    setMode({ kind: 'edit', program })
  }

  const closeModal = () => setMode({ kind: 'closed' })

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    setFormError(null)
    const payload = {
      slug: form.slug.trim(),
      title: form.title.trim(),
      summary: form.summary.trim(),
      description: form.description,
      highlights: form.highlights
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      ctaLabel: form.ctaLabel.trim() || 'Участвовать',
      ctaHref: form.ctaHref.trim() || null,
      sortOrder: form.sortOrder,
      isPublished: form.isPublished,
    }
    const result =
      mode.kind === 'create'
        ? await programsApi.createProgram(payload)
        : mode.kind === 'edit'
          ? await programsApi.updateProgram(mode.program.id, payload)
          : { error: 'Неизвестное действие' as string | null, data: null }
    setIsSaving(false)
    if (result.error) {
      setFormError(result.error)
      return
    }
    closeModal()
    await reload()
  }

  const handleDelete = async (program: Program) => {
    if (!confirm(`Удалить программу «${program.title}»?`)) return
    const res = await programsApi.deleteProgram(program.id)
    if (res.error) {
      setError(res.error)
      return
    }
    await reload()
  }

  return (
    <AdminLayout
      title="Программы"
      description="Карточки с тремя направлениями участия на главной странице."
      actions={<Button onClick={openCreate}>+ Новая программа</Button>}
    >
      {error ? (
        <Alert variant="error" title="Ошибка">
          {error}
        </Alert>
      ) : null}

      {isLoading ? (
        <Spinner label="Загружаем программы..." />
      ) : (
        <AdminTable
          data={programs}
          rowKey={(item) => item.id}
          columns={[
            {
              key: 'title',
              header: 'Название',
              render: (item) => (
                <div>
                  <strong>{item.title}</strong>
                  <div className={styles.muted}>/{item.slug}</div>
                </div>
              ),
            },
            {
              key: 'summary',
              header: 'Описание',
              render: (item) => (
                <span className={styles.muted}>{item.summary}</span>
              ),
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
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEdit(item)}
                  >
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
            {mode.kind === 'create' ? 'Новая программа' : 'Редактировать программу'}
          </h2>

          {formError ? <Alert variant="error">{formError}</Alert> : null}

          <div className={styles.grid2}>
            <TextField
              label="Название"
              required
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            />
            <TextField
              label="Slug"
              required
              hint="Уникальный идентификатор, например 'quiz'"
              value={form.slug}
              onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
            />
          </div>

          <TextField
            multiline
            label="Краткое описание"
            value={form.summary}
            onChange={(e) =>
              setForm((p) => ({ ...p, summary: e.target.value }))
            }
            rows={3}
          />

          <TextField
            multiline
            label="Подробное описание"
            value={form.description}
            onChange={(e) =>
              setForm((p) => ({ ...p, description: e.target.value }))
            }
            rows={5}
          />

          <TextField
            multiline
            label="Преимущества (каждое с новой строки)"
            value={form.highlights}
            onChange={(e) =>
              setForm((p) => ({ ...p, highlights: e.target.value }))
            }
            rows={5}
          />

          <div className={styles.grid2}>
            <TextField
              label="Текст кнопки"
              value={form.ctaLabel}
              onChange={(e) =>
                setForm((p) => ({ ...p, ctaLabel: e.target.value }))
              }
            />
            <TextField
              label="Ссылка кнопки"
              value={form.ctaHref}
              onChange={(e) =>
                setForm((p) => ({ ...p, ctaHref: e.target.value }))
              }
              placeholder="/events/quiz"
            />
          </div>

          <div className={styles.grid2}>
            <TextField
              type="number"
              label="Порядок отображения"
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
