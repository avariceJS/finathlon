import type { AccountAchievement } from '@/pages/account/model/types'

import styles from './AchievementCard.module.css'

type AchievementCardProps = {
  item: AccountAchievement
}

export function AchievementCard({ item }: AchievementCardProps) {
  const progressPercent = Math.min(
    100,
    Math.round((item.progressCurrent / item.progressTotal) * 100),
  )

  return (
    <article className={styles.card}>
      <div className={styles.icon} />

      <h3 className={styles.title}>{item.title}</h3>
      <p className={styles.description}>{item.description}</p>

      <div className={styles.progressRow}>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressBar}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <span className={styles.progressText}>
          {item.progressCurrent}/{item.progressTotal}
        </span>
      </div>
    </article>
  )
}