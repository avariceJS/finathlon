import { cx } from '@/shared/lib/classNames'
import type { AccountNotification } from '@/pages/account/model/types'

import styles from './NotificationCard.module.css'

type NotificationCardProps = {
  item: AccountNotification
  onToggleRead: (id: string) => void
}

export function NotificationCard({
  item,
  onToggleRead,
}: NotificationCardProps) {
  return (
    <article className={cx(styles.card, item.isRead && styles.cardRead)}>
      <div className={styles.body}>
        <h3 className={styles.title}>{item.title}</h3>
        <p className={styles.description}>{item.description}</p>
      </div>

      <div className={styles.actions}>
        <a
          className={cx(styles.button, !item.documentUrl && styles.buttonDisabled)}
          href={item.documentUrl || '#'}
          onClick={(event) => {
            if (!item.documentUrl) {
              event.preventDefault()
            }
          }}
        >
          Открыть документ
        </a>

        <button
          className={styles.button}
          type="button"
          onClick={() => onToggleRead(item.id)}
        >
          {item.isRead ? 'Прочитано' : 'Отметить прочитанным'}
        </button>
      </div>
    </article>
  )
}