import type { AccountAchievement } from '@/pages/account/model/types'
import { AchievementCard } from '@/entities/account/ui/AchievementCard'

import styles from './AchievementsSection.module.css'

type AchievementsSectionProps = {
  achievements: AccountAchievement[]
}

export function AchievementsSection({
  achievements,
}: AchievementsSectionProps) {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Достижения</h2>

      <div className={styles.grid}>
        {achievements.map((item) => (
          <AchievementCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}