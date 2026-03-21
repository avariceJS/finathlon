import { useState } from 'react'

import type { AccountNotification } from '@/pages/account/model/types'
import { NotificationCard } from '@/entities/account/ui/NotificationCard'

import styles from './NotificationsSection.module.css'

type NotificationsSectionProps = {
  items: AccountNotification[]
}

export function NotificationsSection({
  items,
}: NotificationsSectionProps) {
  const [notifications, setNotifications] = useState(items)

  const handleToggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isRead: !item.isRead } : item,
      ),
    )
  }

  const handleReadAll = () => {
    setNotifications((prev) =>
      prev.map((item) => ({
        ...item,
        isRead: true,
      })),
    )
  }

  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <h2 className={styles.title}>Уведомления</h2>

        <button className={styles.readAllButton} type="button" onClick={handleReadAll}>
          Прочитать всё
        </button>
      </div>

      <div className={styles.list}>
        {notifications.map((item) => (
          <NotificationCard
            key={item.id}
            item={item}
            onToggleRead={handleToggleRead}
          />
        ))}
      </div>
    </section>
  )
}