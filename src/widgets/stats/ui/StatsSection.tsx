import type { StatItem } from '@/pages/home/model/types'
import { Section } from '@/shared/ui/section/Section'

import styles from './StatsSection.module.css'

type StatsSectionProps = {
  items: StatItem[]
}

export function StatsSection({ items }: StatsSectionProps) {
  return (
    <Section title="Участники Финатлона" centered>
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