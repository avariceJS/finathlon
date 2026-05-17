import { useEffect, useState } from 'react'

import { adminApi, type AdminProfile } from '@/shared/api'
import { Alert } from '@/shared/ui/alert/Alert'
import { Button } from '@/shared/ui/button/Button'
import { Modal } from '@/shared/ui/modal/Modal'
import { Spinner } from '@/shared/ui/spinner/Spinner'
import { TextField } from '@/shared/ui/text-field/TextField'
import { AdminLayout } from '@/widgets/admin-layout'
import { AdminTable } from '@/widgets/admin-table'
import { formatDate } from '@/shared/lib/format'

import styles from './admin-form.module.css'

type AwardForm = {
  title: string
  description: string
  progressCurrent: number
  progressTotal: number
}

const EMPTY_AWARD: AwardForm = {
  title: '',
  description: '',
  progressCurrent: 1,
  progressTotal: 1,
}

type NewUserForm = {
  email: string
  password: string
  firstName: string
  lastName: string
}

const EMPTY_NEW_USER: NewUserForm = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [awardTarget, setAwardTarget] = useState<AdminProfile | null>(null)
  const [awardForm, setAwardForm] = useState<AwardForm>(EMPTY_AWARD)
  const [awardError, setAwardError] = useState<string | null>(null)
  const [isSavingAward, setIsSavingAward] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newUserForm, setNewUserForm] = useState<NewUserForm>(EMPTY_NEW_USER)
  const [createError, setCreateError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const reload = async () => {
    setIsLoading(true)
    setError(null)
    const res = await adminApi.listProfiles()
    setUsers(res.data ?? [])
    setError(res.error)
    setIsLoading(false)
  }

  useEffect(() => {
    void reload()
  }, [])

  const handleToggleAdmin = async (user: AdminProfile) => {
    const nextRole = user.role === 'admin' ? 'user' : 'admin'
    if (
      !confirm(
        nextRole === 'admin'
          ? `Сделать ${user.email || user.id} администратором?`
          : `Снять права администратора у ${user.email || user.id}?`,
      )
    )
      return
    const res = await adminApi.setUserRole(user.id, nextRole)
    if (res.error) {
      setError(res.error)
      return
    }
    await reload()
  }

  const openAward = (user: AdminProfile) => {
    setAwardTarget(user)
    setAwardForm(EMPTY_AWARD)
    setAwardError(null)
  }

  const closeAward = () => {
    setAwardTarget(null)
  }

  const submitAward = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!awardTarget) return
    setIsSavingAward(true)
    setAwardError(null)
    const result = await adminApi.awardAchievement(awardTarget.id, {
      title: awardForm.title.trim(),
      description: awardForm.description.trim() || undefined,
      progressCurrent: awardForm.progressCurrent,
      progressTotal: awardForm.progressTotal,
    })
    setIsSavingAward(false)
    if (result.error) {
      setAwardError(result.error)
      return
    }
    closeAward()
    await reload()
  }

  const closeCreate = () => {
    setIsCreateOpen(false)
    setNewUserForm(EMPTY_NEW_USER)
    setCreateError(null)
  }

  const submitCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsCreating(true)
    setCreateError(null)
    const result = await adminApi.createAuthUser({
      email: newUserForm.email,
      password: newUserForm.password,
      firstName: newUserForm.firstName,
      lastName: newUserForm.lastName,
    })
    setIsCreating(false)
    if (result.error) {
      setCreateError(result.error)
      return
    }
    closeCreate()
    await reload()
  }

  return (
    <AdminLayout
      title="Пользователи"
      description="Создавайте учётные записи, просматривайте профили, управляйте ролями и выдавайте достижения."
      actions={
        <Button onClick={() => setIsCreateOpen(true)}>+ Новый пользователь</Button>
      }
    >
      {error ? (
        <Alert variant="error" title="Ошибка">
          {error}
        </Alert>
      ) : null}

      {isLoading ? (
        <Spinner label="Загружаем пользователей..." />
      ) : (
        <AdminTable
          data={users}
          rowKey={(item) => item.id}
          columns={[
            {
              key: 'user',
              header: 'Пользователь',
              render: (item) => (
                <div>
                  <strong>
                    {[item.firstName, item.lastName]
                      .filter(Boolean)
                      .join(' ') || item.email || item.id}
                  </strong>
                  <div className={styles.muted}>{item.email}</div>
                </div>
              ),
            },
            {
              key: 'role',
              header: 'Роль',
              render: (item) => (
                <span
                  className={
                    item.role === 'admin'
                      ? styles.badgeOrganizer
                      : styles.badgePartner
                  }
                >
                  {item.role === 'admin' ? 'Админ' : 'Пользователь'}
                </span>
              ),
              width: '160px',
            },
            {
              key: 'stats',
              header: 'Активность',
              render: (item) => (
                <div className={styles.muted}>
                  Мероприятий: {item.eventsCount} · Достижений:{' '}
                  {item.achievementsCount}
                </div>
              ),
              width: '260px',
            },
            {
              key: 'date',
              header: 'Регистрация',
              render: (item) => formatDate(item.createdAt),
              width: '160px',
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
                    onClick={() => openAward(item)}
                  >
                    Выдать ачивку
                  </Button>
                  <Button
                    size="sm"
                    variant={item.role === 'admin' ? 'danger' : 'secondary'}
                    onClick={() => handleToggleAdmin(item)}
                  >
                    {item.role === 'admin' ? 'Снять админа' : 'Сделать админом'}
                  </Button>
                </div>
              ),
              width: '320px',
            },
          ]}
        />
      )}

      <Modal isOpen={awardTarget !== null} onClose={closeAward}>
        <form className={styles.form} onSubmit={submitAward}>
          <h2 className={styles.formTitle}>Выдать достижение</h2>
          {awardError ? <Alert variant="error">{awardError}</Alert> : null}

          <TextField
            label="Название достижения"
            required
            value={awardForm.title}
            onChange={(e) =>
              setAwardForm((p) => ({ ...p, title: e.target.value }))
            }
          />
          <TextField
            multiline
            label="Описание"
            value={awardForm.description}
            onChange={(e) =>
              setAwardForm((p) => ({ ...p, description: e.target.value }))
            }
            rows={3}
          />
          <div className={styles.grid2}>
            <TextField
              type="number"
              label="Прогресс"
              value={String(awardForm.progressCurrent)}
              onChange={(e) =>
                setAwardForm((p) => ({
                  ...p,
                  progressCurrent: Number(e.target.value) || 0,
                }))
              }
            />
            <TextField
              type="number"
              label="Цель"
              value={String(awardForm.progressTotal)}
              onChange={(e) =>
                setAwardForm((p) => ({
                  ...p,
                  progressTotal: Number(e.target.value) || 1,
                }))
              }
            />
          </div>

          <div className={styles.formActions}>
            <Button type="button" variant="ghost" onClick={closeAward}>
              Отмена
            </Button>
            <Button type="submit" loading={isSavingAward}>
              Выдать
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isCreateOpen} onClose={closeCreate}>
        <form className={styles.form} onSubmit={submitCreateUser}>
          <h2 className={styles.formTitle}>Новый пользователь</h2>
          <p className={styles.muted}>
            Требуется Vercel и переменная окружения SUPABASE_SERVICE_ROLE_KEY.
          </p>
          {createError ? <Alert variant="error">{createError}</Alert> : null}
          <div className={styles.grid2}>
            <TextField
              label="Имя"
              value={newUserForm.firstName}
              onChange={(e) =>
                setNewUserForm((p) => ({ ...p, firstName: e.target.value }))
              }
            />
            <TextField
              label="Фамилия"
              value={newUserForm.lastName}
              onChange={(e) =>
                setNewUserForm((p) => ({ ...p, lastName: e.target.value }))
              }
            />
          </div>
          <TextField
            label="Email"
            type="email"
            required
            autoComplete="off"
            value={newUserForm.email}
            onChange={(e) =>
              setNewUserForm((p) => ({ ...p, email: e.target.value }))
            }
          />
          <TextField
            label="Пароль"
            type="password"
            required
            autoComplete="new-password"
            value={newUserForm.password}
            onChange={(e) =>
              setNewUserForm((p) => ({ ...p, password: e.target.value }))
            }
          />
          <div className={styles.formActions}>
            <Button type="button" variant="ghost" onClick={closeCreate}>
              Отмена
            </Button>
            <Button type="submit" loading={isCreating}>
              Создать
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  )
}
