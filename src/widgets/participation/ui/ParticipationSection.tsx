import type { ParticipationItem } from '@/pages/home/model/types'
import { Section } from '@/shared/ui/section/Section'

import { ParticipationCard } from './ParticipationCard'
import styles from './ParticipationSection.module.css'

type ParticipationSectionProps = {
  items: ParticipationItem[]
}

export function ParticipationSection({ items }: ParticipationSectionProps) {
  return (
    <Section title="Как принять участие">
      <div className={styles.grid}>
        {items.map((item) => (
          <ParticipationCard key={item.id} item={item} />
        ))}
      </div>
    </Section>
  )
}