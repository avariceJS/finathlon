import { useEffect, useState } from 'react'

import type { Partner, PartnerKind } from '@/entities/partner'
import { partnersApi } from '@/shared/api'
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
  | { kind: 'edit'; partner: Partner }

type FormState = {
  name: string
  description: string
  logoUrl: string
  websiteUrl: string
  kind: PartnerKind
  sortOrder: number
  isPublished: boolean
}

const EMPTY: FormState = {
  name: '',
  description: '',
  logoUrl: '',
  websiteUrl: '',
  kind: 'partner',
  sortOrder: 0,
  isPublished: true,
}

export function AdminPartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>({ kind: 'closed' })
  const [form, setForm] = useState<FormState>(EMPTY)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const reload = async () => {
    setIsLoading(true)
    setError(null)
    const res = await partnersApi.listPartners({ includeUnpublished: true })
    setPartners(res.data ?? [])
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

  const openEdit = (partner: Partner) => {
    setForm({
      name: partner.name,
      description: partner.description,
      logoUrl: partner.logoUrl ?? '',
      websiteUrl: partner.websiteUrl ?? '',
      kind: partner.kind,
      sortOrder: partner.sortOrder,
      isPublished: partner.isPublished,
    })
    setFormError(null)
    setMode({ kind: 'edit', partner })
  }

  const closeModal = () => setMode({ kind: 'closed' })

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    setFormError(null)
    const payload = {
      name: form.name.trim(),
      description: form.description,
      logoUrl: form.logoUrl.trim() || null,
      websiteUrl: form.websiteUrl.trim() || null,
      kind: form.kind,
      sortOrder: form.sortOrder,
      isPublished: form.isPublished,
    }
    const result =
      mode.kind === 'create'
        ? await partnersApi.createPartner(payload)
        : mode.kind === 'edit'
          ? await partnersApi.updatePartner(mode.partner.id, payload)
          : { error: 'Неизвестное действие' as string | null, data: null }
    setIsSaving(false)
    if (result.error) {
      setFormError(result.error)
      return
    }
    closeModal()
    await reload()
  }

  const handleDelete = async (partner: Partner) => {
    if (!confirm(`Удалить «${partner.name}»?`)) return
    const res = await partnersApi.deletePartner(partner.id)
    if (res.error) {
      setError(res.error)
      return
    }
    await reload()
  }

  return (
    <AdminLayout
      title="Партнёры и организаторы"
      description="Карточки для страницы партнёров. Поле «тип» определяет блок размещения."
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
          data={partners}
          rowKey={(item) => item.id}
          columns={[
            {
              key: 'name',
              header: 'Название',
              render: (item) => <strong>{item.name}</strong>,
            },
            {
              key: 'kind',
              header: 'Тип',
              render: (item) => (
                <span
                  className={
                    item.kind === 'organizer'
                      ? styles.badgeOrganizer
                      : styles.badgePartner
                  }
                >
                  {item.kind === 'organizer' ? 'Организатор' : 'Партнёр'}
                </span>
              ),
              width: '140px',
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
            {mode.kind === 'create' ? 'Новый партнёр' : 'Редактировать'}
          </h2>

          {formError ? <Alert variant="error">{formError}</Alert> : null}

          <TextField
            label="Название"
            required
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
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
            <TextField
              label="Логотип (URL)"
              value={form.logoUrl}
              onChange={(e) =>
                setForm((p) => ({ ...p, logoUrl: e.target.value }))
              }
            />
            <TextField
              label="Сайт"
              value={form.websiteUrl}
              onChange={(e) =>
                setForm((p) => ({ ...p, websiteUrl: e.target.value }))
              }
              placeholder="https://"
            />
          </div>

          <div className={styles.grid2}>
            <Select
              label="Тип"
              value={form.kind}
              onChange={(e) =>
                setForm((p) => ({ ...p, kind: e.target.value as PartnerKind }))
              }
              options={[
                { value: 'partner', label: 'Партнёр' },
                { value: 'organizer', label: 'Организатор' },
              ]}
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
