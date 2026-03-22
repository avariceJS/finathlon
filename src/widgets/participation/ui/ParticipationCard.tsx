import type { ParticipationItem } from '@/pages/home/model/types'
import { Button } from '@/shared/ui/button/Button'

import styles from '../styles/ParticipationCard.module.css'

type ParticipationCardProps = {
  item: ParticipationItem
}

export function ParticipationCard({ item }: ParticipationCardProps) {
  return (
    <article className={styles.card} id={item.id}>
      <div className={styles.body}>
        <h3 className={styles.title}>{item.title}</h3>
        <p className={styles.description}>{item.description}</p>

        <div className={styles.pointsBlock}>
          <span className={styles.pointsTitle}>Пункты:</span>

          <ul className={styles.list}>
            {item.points.map((point) => (
              <li key={point} className={styles.listItem}>
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.actions}>
        <Button>{item.ctaLabel}</Button>
      </div>
    </article>
  )
}