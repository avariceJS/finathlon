import type { UserAchievement } from '@/entities/profile'
import { EmptyState } from '@/shared/ui/empty-state/EmptyState'

import styles from './AchievementsSection.module.css'

type AchievementsSectionProps = {
  achievements: UserAchievement[]
}

export function AchievementsSection({
  achievements,
}: AchievementsSectionProps) {
  if (achievements.length === 0) {
    return (
      <EmptyState
        title="Пока нет достижений"
        description="Здесь появятся ваши значки за участие в мероприятиях и активности на платформе."
      />
    )
  }

  return (
    <section className={styles.section}>
      <header className={styles.head}>
        <h2 className={styles.title}>Достижения</h2>
        <p className={styles.subtitle}>
          Накопительные баллы за участие, призовые места и образовательные
          активности.
        </p>
      </header>

      <div className={styles.grid}>
        {achievements.map((item) => {
          const total = Math.max(1, item.progressTotal)
          const current = Math.max(0, Math.min(total, item.progressCurrent))
          const percent = Math.round((current / total) * 100)
          const completed = current >= total

          return (
            <article
              key={item.id}
              className={`${styles.card} ${completed ? styles.cardDone : ''}`}
            >
              <div className={styles.icon} aria-hidden="true">
                {completed ? '★' : '☆'}
              </div>
              <h3 className={styles.titleSm}>{item.title}</h3>
              {item.description ? (
                <p className={styles.description}>{item.description}</p>
              ) : null}
              <div className={styles.progress}>
                <div className={styles.bar}>
                  <span style={{ width: `${percent}%` }} />
                </div>
                <span className={styles.progressText}>
                  {current}/{total}
                </span>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
