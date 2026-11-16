import { useEffect, useState } from 'react'

import type { Olympiad, OlympiadFormat, OlympiadStatus } from '@/entities/olympiad'
import { olympiadsApi } from '@/shared/api'
import { Alert } from '@/shared/ui/alert/Alert'
import { Button } from '@/shared/ui/button/Button'
import { Modal } from '@/shared/ui/modal/Modal'
import { Select } from '@/shared/ui/select/Select'
import { Spinner } from '@/shared/ui/spinner/Spinner'
import { TextField } from '@/shared/ui/text-field/TextField'
import { RichTextEditor } from '@/shared/ui/rich-text-editor'
import { AdminLayout } from '@/widgets/admin-layout'
import { AdminTable } from '@/widgets/admin-table'

import styles from './admin-form.module.css'

type Mode =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; olympiad: Olympiad }
  | { kind: 'copy'; olympiad: Olympiad }

type FormState = {
  slug: string
  title: string
  profileTitle: string
  season: string
  description: string
  year: number
  format: OlympiadFormat // Заменили stage на format
  status: OlympiadStatus
  startDate: string
  endDate: string
  maxParticipants: number
  isPublished: boolean
  richContent: string
  registrationOpen: boolean | null // Добавили для ручного управления
}

const EMPTY: FormState = {
  slug: '',
  title: '',
  profileTitle: '',
  season: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
  description: '',
  year: new Date().getFullYear(),
  format: 'online',
  status: 'draft',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  maxParticipants: 1000,
  isPublished: true,
  richContent: '',
  registrationOpen: null,
}

export function AdminOlympiadsPage() {
  const [olympiads, setOlympiads] = useState<Olympiad[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>({ kind: 'closed' })
  const [form, setForm] = useState<FormState>(EMPTY)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const reload = async () => {
    setIsLoading(true)
    setError(null)
    const res = await olympiadsApi.listOlympiads({ includeUnpublished: true })
    setOlympiads(res.data ?? [])
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

  const openEdit = (olympiad: Olympiad) => {
    setForm({
      slug: olympiad.slug,
      title: olympiad.title,
      profileTitle: olympiad.profileTitle ?? '',
      season: olympiad.season ?? '',
      description: olympiad.description ?? '',
      year: olympiad.year,
      format: olympiad.format,
      status: olympiad.status,
      startDate: olympiad.startDate ?? new Date().toISOString().slice(0, 10),
      endDate: olympiad.endDate ?? '',
      maxParticipants: olympiad.maxParticipants ?? 1000,
      isPublished: olympiad.isPublished,
      richContent: olympiad.richContent ?? '',
      registrationOpen: olympiad.registrationOpen ?? null,
    })
    setFormError(null)
    setMode({ kind: 'edit', olympiad })
  }

  const closeModal = () => setMode({ kind: 'closed' })

  const validateForm = () => {
    // 1. Проверка сезона
    const seasonRegex = /^2\d{3}[-–—]2\d{3}$/;
    if (form.season && !seasonRegex.test(form.season)) {
      return 'Сезон должен быть в формате "2026-2027"'
    }
    const [startYear, endYear] = form.season.split(/[-–—]/).map(Number)
    if (endYear <= startYear) {
      return 'Второй год сезона должен быть больше первого'
    }

    // 2. Проверка дат
    if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate)) {
      return 'Дата окончания должна быть позже даты начала'
    }
    return null
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      setFormError(validationError)
      return
    }

    setIsSaving(true)
    setFormError(null)
    const payload = {
      slug: form.slug.trim(),
      title: form.title.trim(),
      profileTitle: form.profileTitle.trim(),
      season: form.season,
      description: form.description,
      year: form.year,
      format: form.format,
      status: form.status,
      startDate: form.startDate,
      endDate: form.endDate,
      maxParticipants: form.maxParticipants,
      isPublished: form.isPublished,
      richContent: form.richContent,
      registrationOpen: form.registrationOpen,
    }
    const result =
      mode.kind === 'create'
        ? await olympiadsApi.createOlympiad(payload)
        : mode.kind === 'edit'
          ? await olympiadsApi.updateOlympiad(mode.olympiad.id, payload)
          : { error: 'Неизвестное действие' as string | null, data: null }
    setIsSaving(false)
    if (result.error) {
      setFormError(result.error)
      return
    }
    closeModal()
    await reload()
  }

  const handleDelete = async (olympiad: Olympiad) => {
    if (!confirm(`Удалить олимпиаду «${olympiad.title}»?`)) return
    const res = await olympiadsApi.deleteOlympiad(olympiad.id)
    if (res.error) {
      setError(res.error)
      return
    }
    await reload()
  }

  const openCopyModal = (olympiad: Olympiad) => {
    setForm({
      slug: '',
      title: olympiad.title,
      profileTitle: olympiad.profileTitle ?? '',
      season: olympiad.season ?? '',
      description: olympiad.description ?? '',
      year: olympiad.year,
      format: olympiad.format,
      status: 'draft',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      maxParticipants: 1000,
      isPublished: false,
      richContent: olympiad.richContent ?? '',
      registrationOpen: null,
    })
    setFormError(null)
    setMode({ kind: 'copy', olympiad })
  }

  const closeCopyModal = () => setMode({ kind: 'closed' })

  const handleCopySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      setFormError(validationError)
      return
    }

    setIsSaving(true)
    setFormError(null)
    const payload = {
      slug: form.slug.trim(),
      title: form.title.trim(),
      profileTitle: form.profileTitle.trim(),
      season: form.season,
      description: form.description,
      year: form.year,
      format: form.format,
      status: 'draft' as OlympiadStatus,
      startDate: form.startDate,
      endDate: form.endDate,
      maxParticipants: form.maxParticipants,
      isPublished: false,
      richContent: form.richContent,
      registrationOpen: null,
    }
    const result = await olympiadsApi.createOlympiad(payload)
    setIsSaving(false)
    if (result.error) {
      setFormError(result.error)
      return
    }
    closeCopyModal()
    await reload()
  }

  return (
    <AdminLayout
      title="Олимпиады и профили"
      description="Управление олимпиадными событиями и профилями участников."
      actions={<Button onClick={openCreate}>+ Новая олимпиада</Button>}
    >
      {error ? (
        <Alert variant="error" title="Ошибка">
          {error}
        </Alert>
      ) : null}

      {isLoading ? (
        <Spinner label="Загружаем олимпиады..." />
      ) : (
        <AdminTable
          data={olympiads}
          rowKey={(item) => item.id}
          columns={[
              {
                key: 'title',
                header: 'Название олимпиады',
                render: (item) => (
                  <div>
                    <strong>{item.title}</strong>
                    <div className={styles.muted}>/{item.slug}</div>
                  </div>
                ),
              },
              {
                key: 'profileTitle',
                header: 'Название профиля',
                render: (item) => <div>{item.profileTitle || '—'}</div>,
                width: '150px',
              },
              {
                key: 'season',
                header: 'Сезон',
                render: (item) => <div>{item.season || '—'}</div>,
                width: '80px',
              },
              {
                key: 'year',
                header: 'Год',
                render: (item) => item.year,
                width: '80px',
              },
              {
                key: 'format',
                header: 'Вид',
                render: (item) => {
                  const formatMap: Record<string, string> = {
                    online: 'Онлайн',
                    offline: 'Очная',
                  }
                  return <span>{formatMap[item.format] ?? item.format}</span>
                },
                width: '100px',
              },
              {
                key: 'status',
                header: 'Статус',
                render: (item) => {
                  const statusMap: Record<string, string> = {
                    draft: 'Черновик',
                    published: 'Опубликовано',
                    completed: 'Завершён',
                    archived: 'Архив',
                  }
                  return (
                    <span
                      className={
                        item.status === 'published' ? styles.badgeOk : styles.badgeMuted
                      }
                    >
                      {statusMap[item.status] ?? item.status}
                    </span>
                  )
                },
                width: '120px',
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
                    {item.status !== 'archived' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openCopyModal(item)}
                      >
                        Создать копию
                      </Button>
                    )}
                  </div>
                ),
                width: '240px',
              },
          ]}
        />
      )}

      {/* Модалка для создания и редактирования */}
      <Modal isOpen={mode.kind !== 'closed' && mode.kind !== 'copy'} onClose={closeModal}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <h2 className={styles.formTitle}>
            {mode.kind === 'create' ? 'Новая олимпиада' : 'Редактировать олимпиаду'}
          </h2>

          {formError ? (
            <Alert variant="error">{formError}</Alert>
          ) : null}

          <div className={styles.grid2}>
            <TextField
              label="Slug"
              required
              hint="Используется в URL, например 'olympiad-2026'"
              value={form.slug}
              onChange={(e) =>
                setForm((p) => ({ ...p, slug: e.target.value }))
              }
            />
            <TextField
              label="Название олимпиады"
              required
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            />
          </div>

          <TextField
            label="Название профиля"
            value={form.profileTitle}
            onChange={(e) =>
              setForm((p) => ({ ...p, profileTitle: e.target.value }))
            }
          />

          <div className={styles.grid2}>
            <TextField
              label="Сезон"
              hint="например '2026-2027'"
              value={form.season}
              onChange={(e) => setForm((p) => ({ ...p, season: e.target.value }))}
            />
            <TextField
              multiline
              label="Описание"
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              rows={3}
            />
          </div>

          <div className={styles.grid2}>
            <TextField
              label="Год"
              type="number"
              value={String(form.year)}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  year: Number(e.target.value) || new Date().getFullYear(),
                }))
              }
            />
            <Select
              label="Вид олимпиады"
              value={form.format}
              onChange={(e) =>
                setForm((p) => ({ ...p, format: e.target.value as OlympiadFormat }))
              }
              options={[
                { value: 'online', label: 'Онлайн' },
                { value: 'offline', label: 'Очная' },
              ]}
            />
          </div>

          <div className={styles.grid2}>
            <TextField
              label="Дата начала отборочного этапа"
              type="date"
              value={form.startDate}
              onChange={(e) =>
                setForm((p) => ({ ...p, startDate: e.target.value }))
              }
            />
            <TextField
              label="Дата окончания отборочного этапа"
              type="date"
              value={form.endDate}
              onChange={(e) =>
                setForm((p) => ({ ...p, endDate: e.target.value }))
              }
            />
          </div>

          <div className={styles.grid2}>
            <TextField
              label="Макс. участников"
              type="number"
              value={String(form.maxParticipants)}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  maxParticipants: Number(e.target.value) || 1000,
                }))
              }
            />
            <Select
              label="Статус"
              value={form.status}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  status: e.target.value as OlympiadStatus,
                }))
              }
              options={[
                { value: 'draft', label: 'Черновик' },
                { value: 'published', label: 'Опубликовано' },
                { value: 'completed', label: 'Завершён' },
                { value: 'archived', label: 'Архив' },
              ]}
            />
          </div>

          <Select
            label="Управление регистрацией"
            value={
              form.registrationOpen === null
                ? 'auto'
                : form.registrationOpen
                  ? 'open'
                  : 'closed'
            }
            onChange={(e) => {
              const val = e.target.value;
              setForm((p) => ({
                ...p,
                registrationOpen: val === 'auto' ? null : val === 'open',
              }));
            }}
            options={[
              { value: 'auto', label: 'Автоматически (по датам)' },
              { value: 'open', label: 'Принудительно открыта' },
              { value: 'closed', label: 'Принудительно закрыта' },
            ]}
          />

          <RichTextEditor
            value={form.richContent}
            onChange={(e) => setForm((p) => ({ ...p, richContent: e }))}
          />

          <div className={styles.formActions}>
            <Button type="button" variant="ghost" onClick={closeModal}>
              Отмена
            </Button>
            <Button type="submit" loading={isSaving}>
              {mode.kind === 'create' ? 'Создать' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Модалка для копирования */}
      <Modal isOpen={mode.kind === 'copy'} onClose={closeCopyModal}>
        <form className={styles.form} onSubmit={handleCopySubmit}>
          <h2 className={styles.formTitle}>Создать копию олимпиады</h2>

          {formError ? (
            <Alert variant="error">{formError}</Alert>
          ) : null}

          <div className={styles.grid2}>
            <TextField
              label="Slug"
              required
              hint="Будет сгенерирован автоматически"
              value={form.slug}
              onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
            />
            <TextField
              label="Название олимпиады"
              required
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            />
          </div>

          <TextField
            label="Название профиля"
            value={form.profileTitle}
            onChange={(e) =>
              setForm((p) => ({ ...p, profileTitle: e.target.value }))
            }
          />

          <div className={styles.grid2}>
            <TextField
              label="Сезон"
              hint="например '2026-2027'"
              value={form.season}
              onChange={(e) => setForm((p) => ({ ...p, season: e.target.value }))}
            />
            <TextField
              multiline
              label="Описание"
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              rows={3}
            />
          </div>

          <div className={styles.grid2}>
            <TextField
              label="Год"
              type="number"
              value={String(form.year)}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  year: Number(e.target.value) || new Date().getFullYear(),
                }))
              }
            />
            <Select
              label="Вид олимпиады"
              value={form.format}
              onChange={(e) =>
                setForm((p) => ({ ...p, format: e.target.value as OlympiadFormat }))
              }
              options={[
                { value: 'online', label: 'Онлайн' },
                { value: 'offline', label: 'Очная' },
              ]}
            />
          </div>

          <div className={styles.grid2}>
            <TextField
              label="Дата начала отборочного этапа"
              type="date"
              value={form.startDate}
              onChange={(e) =>
                setForm((p) => ({ ...p, startDate: e.target.value }))
              }
            />
            <TextField
              label="Дата окончания отборочного этапа"
              type="date"
              value={form.endDate}
              onChange={(e) =>
                setForm((p) => ({ ...p, endDate: e.target.value }))
              }
            />
          </div>

          <div className={styles.grid2}>
            <TextField
              label="Макс. участников"
              type="number"
              value={String(form.maxParticipants)}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  maxParticipants: Number(e.target.value) || 1000,
                }))
              }
            />
            <Select
              label="Статус"
              value={form.status}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  status: e.target.value as OlympiadStatus,
                }))
              }
              options={[
                { value: 'draft', label: 'Черновик' },
                { value: 'published', label: 'Опубликовано' },
                { value: 'completed', label: 'Завершён' },
                { value: 'archived', label: 'Архив' },
              ]}
            />
          </div>

          <RichTextEditor
            value={form.richContent}
            onChange={(e) => setForm((p) => ({ ...p, richContent: e }))}
          />

          <div className={styles.formActions}>
            <Button type="button" variant="ghost" onClick={closeCopyModal}>
              Отмена
            </Button>
            <Button type="submit" loading={isSaving}>
              Создать копию
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  )
}