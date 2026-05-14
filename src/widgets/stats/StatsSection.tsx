import type { StatItem } from '@/entities/stat'
import { Section } from '@/shared/ui/section/Section'

import styles from './StatsSection.module.css'

type StatsSectionProps = {
  items: StatItem[]
}

export function StatsSection({ items }: StatsSectionProps) {
  if (items.length === 0) return null

  return (
    <Section
      title="Финатлон в цифрах"
      description="Платформа объединяет школьников, студентов и вузы по всей стране."
      centered
    >
      <div className={styles.grid}>
        {items.map((item) => (
          <article key={item.id} className={styles.card}>
            <div className={styles.value}>{item.value}</div>
            <div className={styles.label}>{item.label}</div>
          </article>
        ))}
      </div>
    </Section>
  )
}
