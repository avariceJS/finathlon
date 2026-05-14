import { useEffect, useState } from 'react'

import type { StatItem } from '@/entities/stat'
import { statsApi } from '@/shared/api'
import { Alert } from '@/shared/ui/alert/Alert'
import { Button } from '@/shared/ui/button/Button'
import { Modal } from '@/shared/ui/modal/Modal'
import { Spinner } from '@/shared/ui/spinner/Spinner'
import { TextField } from '@/shared/ui/text-field/TextField'
import { AdminLayout } from '@/widgets/admin-layout'
import { AdminTable } from '@/widgets/admin-table'

import styles from './admin-form.module.css'

type Mode = { kind: 'closed' } | { kind: 'create' } | { kind: 'edit'; stat: StatItem }

type FormState = {
  metricKey: string
  value: string
  label: string
  sortOrder: number
  isPublished: boolean
}

const EMPTY: FormState = {
  metricKey: '',
  value: '',
  label: '',
  sortOrder: 0,
  isPublished: true,
}

export function AdminStatsPage() {
  const [items, setItems] = useState<StatItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>({ kind: 'closed' })
  const [form, setForm] = useState<FormState>(EMPTY)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const reload = async () => {
    setIsLoading(true)
    setError(null)
    const res = await statsApi.listStats({ includeUnpublished: true })
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

  const openEdit = (stat: StatItem) => {
    setForm({
      metricKey: stat.metricKey,
      value: stat.value,
      label: stat.label,
      sortOrder: stat.sortOrder,
      isPublished: stat.isPublished,
    })
    setFormError(null)
    setMode({ kind: 'edit', stat })
  }

  const closeModal = () => setMode({ kind: 'closed' })

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    setFormError(null)
    const payload = {
      metricKey: form.metricKey.trim(),
      value: form.value.trim(),
      label: form.label.trim(),
      sortOrder: form.sortOrder,
      isPublished: form.isPublished,
    }
    const result = await statsApi.upsertStat(payload)
    setIsSaving(false)
    if (result.error) {
      setFormError(result.error)
      return
    }
    closeModal()
    await reload()
  }

  const handleDelete = async (stat: StatItem) => {
    if (!confirm(`Удалить «${stat.label}»?`)) return
    const res = await statsApi.deleteStat(stat.id)
    if (res.error) {
      setError(res.error)
      return
    }
    await reload()
  }

  return (
    <AdminLayout
      title="Статистика"
      description="Числа в блоке «Финатлон в цифрах»."
      actions={<Button onClick={openCreate}>+ Метрика</Button>}
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
              key: 'label',
              header: 'Метрика',
              render: (item) => (
                <div>
                  <strong>{item.label}</strong>
                  <div className={styles.muted}>{item.metricKey}</div>
                </div>
              ),
            },
            {
              key: 'value',
              header: 'Значение',
              render: (item) => <span className={styles.muted}>{item.value}</span>,
              width: '180px',
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
            {mode.kind === 'create' ? 'Новая метрика' : 'Редактировать метрику'}
          </h2>
          {formError ? <Alert variant="error">{formError}</Alert> : null}

          <div className={styles.grid2}>
            <TextField
              label="Ключ"
              required
              placeholder="school"
              value={form.metricKey}
              onChange={(e) =>
                setForm((p) => ({ ...p, metricKey: e.target.value }))
              }
              disabled={mode.kind === 'edit'}
            />
            <TextField
              label="Значение"
              required
              placeholder="5+ тыс"
              value={form.value}
              onChange={(e) =>
                setForm((p) => ({ ...p, value: e.target.value }))
              }
            />
          </div>
          <TextField
            label="Подпись"
            required
            placeholder="Школьников"
            value={form.label}
            onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
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
