import { useState } from 'react'

import type { UserNotification } from '@/entities/profile'
import { profileApi } from '@/shared/api'
import { useAuth } from '@/shared/auth'
import { cx } from '@/shared/lib/classNames'
import { formatDateTime } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button/Button'
import { EmptyState } from '@/shared/ui/empty-state/EmptyState'

import styles from './NotificationsSection.module.css'

type NotificationsSectionProps = {
  notifications: UserNotification[]
  onChange: () => Promise<void> | void
}

export function NotificationsSection({
  notifications,
  onChange,
}: NotificationsSectionProps) {
  const { user } = useAuth()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [allBusy, setAllBusy] = useState(false)

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const handleToggle = async (item: UserNotification) => {
    setBusyId(item.id)
    await profileApi.markNotificationRead(item.id, !item.isRead)
    setBusyId(null)
    await onChange()
  }

  const handleReadAll = async () => {
    if (!user?.id || unreadCount === 0) return
    setAllBusy(true)
    await profileApi.markAllNotificationsRead(user.id)
    setAllBusy(false)
    await onChange()
  }

  return (
    <section className={styles.section}>
      <header className={styles.head}>
        <div>
          <h2 className={styles.title}>Уведомления</h2>
          <p className={styles.subtitle}>
            {unreadCount > 0
              ? `${unreadCount} непрочитанных`
              : 'Всё прочитано — отличная работа!'}
          </p>
        </div>
        {unreadCount > 0 ? (
          <Button
            variant="secondary"
            onClick={handleReadAll}
            loading={allBusy}
          >
            Прочитать всё
          </Button>
        ) : null}
      </header>

      {notifications.length === 0 ? (
        <EmptyState
          title="Уведомлений пока нет"
          description="Когда появятся новости по вашему участию, мы сообщим именно здесь."
        />
      ) : (
        <div className={styles.list}>
          {notifications.map((item) => (
            <article
              key={item.id}
              className={cx(styles.card, item.isRead && styles.cardRead)}
            >
              <header className={styles.cardHead}>
                <span className={styles.cardDate}>
                  {formatDateTime(item.createdAt)}
                </span>
                {!item.isRead ? (
                  <span className={styles.unreadDot} aria-label="Не прочитано" />
                ) : null}
              </header>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              {item.description ? (
                <p className={styles.cardDescription}>{item.description}</p>
              ) : null}
              <div className={styles.actions}>
                {item.documentUrl ? (
                  <Button size="sm" variant="ghost" href={item.documentUrl}>
                    Открыть документ
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleToggle(item)}
                  loading={busyId === item.id}
                >
                  {item.isRead ? 'Отметить непрочитанным' : 'Прочитать'}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
