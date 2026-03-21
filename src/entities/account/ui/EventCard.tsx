import { cx } from '@/shared/lib/classNames'
import type { AccountEvent } from '@/pages/account/model/types'

import styles from './EventCard.module.css'

type EventCardProps = {
  item: AccountEvent
}

export function EventCard({ item }: EventCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.date}>{item.dateLabel}</div>

      <div className={styles.body}>
        <h3 className={styles.title}>{item.title}</h3>
        <p className={styles.result}>{item.result}</p>
      </div>

      <div className={styles.actions}>
        <a
          className={cx(styles.button, !item.publicationUrl && styles.buttonDisabled)}
          href={item.publicationUrl || '#'}
          onClick={(event) => {
            if (!item.publicationUrl) {
              event.preventDefault()
            }
          }}
        >
          Публикация в РИНЦ
        </a>

        <a
          className={cx(styles.button, !item.diplomaUrl && styles.buttonDisabled)}
          href={item.diplomaUrl || '#'}
          onClick={(event) => {
            if (!item.diplomaUrl) {
              event.preventDefault()
            }
          }}
        >
          Скачать диплом
        </a>
      </div>
    </article>
  )
}