import { useEffect, useState } from 'react'

import type { OlympiadProfile, OlympiadProfileCategory, OlympiadProfileRank } from '@/entities/olympiad'
import { olympiadProfilesApi } from '@/shared/api'
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
  | { kind: 'edit'; profile: OlympiadProfile }

type FormState = {
  userId: string
  olympiadId: string
  olympiadYear: number
  category: OlympiadProfileCategory
  score: number
  rank: OlympiadProfileRank
  diplomaUrl: string
  certificateUrl: string
  notes: string
}

const EMPTY: FormState = {
  userId: '',
  olympiadId: '',
  olympiadYear: new Date().getFullYear(),
  category: 'general',
  score: 0,
  rank: 'participant',
  diplomaUrl: '',
  certificateUrl: '',
  notes: '',
}

export function AdminOlympiadProfilesPage() {
  const [profiles, setProfiles] = useState<OlympiadProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>({ kind: 'closed' })
  const [form, setForm] = useState<FormState>(EMPTY)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const reload = async () => {
    setIsLoading(true)
    setError(null)
    const res = await olympiadProfilesApi.listOlympiadProfiles()
    setProfiles(res.data ?? [])
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

  const openEdit = (profile: OlympiadProfile) => {
    setForm({
      userId: profile.userId,
      olympiadId: profile.olympiadId,
      olympiadYear: profile.olympiadYear,
      category: profile.category,
      score: profile.score,
      rank: profile.rank,
      diplomaUrl: profile.diplomaUrl ?? '',
      certificateUrl: profile.certificateUrl ?? '',
      notes: profile.notes ?? '',
    })
    setFormError(null)
    setMode({ kind: 'edit', profile })
  }

  const closeModal = () => setMode({ kind: 'closed' })

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    setFormError(null)
    const payload = {
      userId: form.userId.trim(),
      olympiadId: form.olympiadId.trim(),
      olympiadYear: form.olympiadYear,
      category: form.category,
      score: form.score,
      rank: form.rank,
      diplomaUrl: form.diplomaUrl.trim() || null,
      certificateUrl: form.certificateUrl.trim() || null,
      notes: form.notes.trim() || null,
    }
    const result =
      mode.kind === 'create'
        ? await olympiadProfilesApi.createOlympiadProfile(payload)
        : mode.kind === 'edit'
          ? await olympiadProfilesApi.updateOlympiadProfile(mode.profile.id, payload)
          : { error: 'Неизвестное действие' as string | null, data: null }
    setIsSaving(false)
    if (result.error) {
      setFormError(result.error)
      return
    }
    closeModal()
    await reload()
  }

  const handleDelete = async (profile: OlympiadProfile) => {
    if (!confirm(`Удалить профиль «${profile.olympiadId}»?`)) return
    const res = await olympiadProfilesApi.deleteOlympiadProfile(profile.id)
    if (res.error) {
      setError(res.error)
      return
    }
    await reload()
  }

  return (
    <AdminLayout
      title="Профили олимпиад"
      description="Управление профилями участников олимпиадных событий."
      actions={<Button onClick={openCreate}>+ Новый профиль</Button>}
    >
      {error ? (
        <Alert variant="error" title="Ошибка">
          {error}
        </Alert>
      ) : null}

      {isLoading ? (
        <Spinner label="Загружаем профили..." />
      ) : (
        <AdminTable
          data={profiles}
          rowKey={(item) => item.id}
          columns={[
            {
              key: 'olympiadId',
              header: 'Олимпиада',
              render: (item) => <div>{item.olympiadId}</div>,
              width: '150px',
            },
            {
              key: 'userId',
              header: 'Пользователь',
              render: (item) => <div>{item.userId}</div>,
              width: '150px',
            },
            {
              key: 'olympiadYear',
              header: 'Год',
              render: (item) => item.olympiadYear,
              width: '80px',
            },
            {
              key: 'category',
              header: 'Категория',
              render: (item) => {
                const categoryMap: Record<string, string> = {
                  general: 'Общая',
                  '8-9': '8-9 классы',
                  '10-11': '10-11 классы',
                  university: 'Университет',
                }
                return <span>{categoryMap[item.category] ?? item.category}</span>
              },
              width: '120px',
            },
            {
              key: 'score',
              header: 'Баллы',
              render: (item) => item.score,
              width: '80px',
            },
            {
              key: 'rank',
              header: 'Звание',
              render: (item) => {
                const rankMap: Record<string, string> = {
                  participant: 'Участник',
                  winner: 'Победитель',
                  prize_winner: 'Призёр',
                  finalist: 'Финалист',
                }
                return <span>{rankMap[item.rank] ?? item.rank}</span>
              },
              width: '100px',
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
              width: '200px',
            },
          ]}
        />
      )}

      <Modal isOpen={mode.kind !== 'closed'} onClose={closeModal}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <h2 className={styles.formTitle}>
            {mode.kind === 'create' ? 'Новый профиль' : 'Редактировать профиль'}
          </h2>

          {formError ? (
            <Alert variant="error">{formError}</Alert>
          ) : null}

          <div className={styles.grid2}>
            <TextField
              label="ID пользователя"
              required
              value={form.userId}
              onChange={(e) => setForm((p) => ({ ...p, userId: e.target.value }))}
            />
            <TextField
              label="ID олимпиады"
              required
              value={form.olympiadId}
              onChange={(e) => setForm((p) => ({ ...p, olympiadId: e.target.value }))}
            />
          </div>

          <div className={styles.grid2}>
            <TextField
              label="Год олимпиады"
              type="number"
              value={String(form.olympiadYear)}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  olympiadYear: Number(e.target.value) || new Date().getFullYear(),
                }))
              }
            />
            <Select
              label="Категория"
              value={form.category}
              onChange={(e) =>
                setForm((p) => ({ ...p, category: e.target.value as OlympiadProfileCategory }))
              }
              options={[
                { value: 'general', label: 'Общая' },
                { value: '8-9', label: '8-9 классы' },
                { value: '10-11', label: '10-11 классы' },
                { value: 'university', label: 'Университет' },
              ]}
            />
          </div>

          <div className={styles.grid2}>
            <TextField
              label="Баллы"
              type="number"
              value={String(form.score)}
              onChange={(e) =>
                setForm((p) => ({ ...p, score: Number(e.target.value) || 0 }))
              }
            />
            <Select
              label="Звание"
              value={form.rank}
              onChange={(e) =>
                setForm((p) => ({ ...p, rank: e.target.value as OlympiadProfileRank }))
              }
              options={[
                { value: 'participant', label: 'Участник' },
                { value: 'winner', label: 'Победитель' },
                { value: 'prize_winner', label: 'Призёр' },
                { value: 'finalist', label: 'Финалист' },
              ]}
            />
          </div>

          <div className={styles.grid2}>
            <TextField
              label="Ссылка на диплом"
              value={form.diplomaUrl}
              onChange={(e) => setForm((p) => ({ ...p, diplomaUrl: e.target.value }))}
            />
            <TextField
              label="Ссылка на сертификат"
              value={form.certificateUrl}
              onChange={(e) => setForm((p) => ({ ...p, certificateUrl: e.target.value }))}
            />
          </div>

          <TextField
            multiline
            label="Заметки"
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            rows={3}
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
    </AdminLayout>
  )
}
