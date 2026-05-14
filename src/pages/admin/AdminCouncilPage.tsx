import { useEffect, useState } from 'react'

import type { CouncilMember } from '@/entities/council'
import { councilApi } from '@/shared/api'
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
  | { kind: 'edit'; member: CouncilMember }

type FormState = {
  fullName: string
  title: string
  bio: string
  photoUrl: string
  sortOrder: number
  isPublished: boolean
}

const EMPTY: FormState = {
  fullName: '',
  title: '',
  bio: '',
  photoUrl: '',
  sortOrder: 0,
  isPublished: true,
}

export function AdminCouncilPage() {
  const [members, setMembers] = useState<CouncilMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>({ kind: 'closed' })
  const [form, setForm] = useState<FormState>(EMPTY)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const reload = async () => {
    setIsLoading(true)
    setError(null)
    const res = await councilApi.listCouncil({ includeUnpublished: true })
    setMembers(res.data ?? [])
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

  const openEdit = (member: CouncilMember) => {
    setForm({
      fullName: member.fullName,
      title: member.title,
      bio: member.bio,
      photoUrl: member.photoUrl ?? '',
      sortOrder: member.sortOrder,
      isPublished: member.isPublished,
    })
    setFormError(null)
    setMode({ kind: 'edit', member })
  }

  const closeModal = () => setMode({ kind: 'closed' })

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    setFormError(null)
    const payload = {
      fullName: form.fullName.trim(),
      title: form.title.trim(),
      bio: form.bio,
      photoUrl: form.photoUrl.trim() || null,
      sortOrder: form.sortOrder,
      isPublished: form.isPublished,
    }
    const result =
      mode.kind === 'create'
        ? await councilApi.createCouncilMember(payload)
        : mode.kind === 'edit'
          ? await councilApi.updateCouncilMember(mode.member.id, payload)
          : { error: 'Неизвестное действие' as string | null, data: null }
    setIsSaving(false)
    if (result.error) {
      setFormError(result.error)
      return
    }
    closeModal()
    await reload()
  }

  const handleDelete = async (member: CouncilMember) => {
    if (!confirm(`Удалить «${member.fullName}»?`)) return
    const res = await councilApi.deleteCouncilMember(member.id)
    if (res.error) {
      setError(res.error)
      return
    }
    await reload()
  }

  return (
    <AdminLayout
      title="Попечительский совет"
      description="Эксперты, входящие в совет проекта."
      actions={<Button onClick={openCreate}>+ Добавить</Button>}
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
          data={members}
          rowKey={(item) => item.id}
          columns={[
            {
              key: 'name',
              header: 'ФИО',
              render: (item) => <strong>{item.fullName}</strong>,
            },
            {
              key: 'title',
              header: 'Должность',
              render: (item) => <span>{item.title}</span>,
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
            {mode.kind === 'create' ? 'Новый член совета' : 'Редактировать'}
          </h2>

          {formError ? <Alert variant="error">{formError}</Alert> : null}

          <TextField
            label="ФИО"
            required
            value={form.fullName}
            onChange={(e) =>
              setForm((p) => ({ ...p, fullName: e.target.value }))
            }
          />
          <TextField
            label="Должность / титул"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          />
          <TextField
            multiline
            label="Биография"
            value={form.bio}
            onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
            rows={5}
          />
          <div className={styles.grid2}>
            <TextField
              label="Фото (URL)"
              value={form.photoUrl}
              onChange={(e) =>
                setForm((p) => ({ ...p, photoUrl: e.target.value }))
              }
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
