import type { TimelineEvent } from '@/entities/timeline'
import { Section } from '@/shared/ui/section/Section'

import styles from './TimelineSection.module.css'

type TimelineSectionProps = {
  events: TimelineEvent[]
}

export function TimelineSection({ events }: TimelineSectionProps) {
  if (events.length === 0) return null

  const sorted = [...events].sort(
    (a, b) => a.year - b.year || a.sortOrder - b.sortOrder,
  )

  return (
    <Section
      id="timeline"
      title="Таймлайн событий"
      description="Ключевые даты ближайших мероприятий проекта."
    >
      <ol className={styles.list}>
        {sorted.map((event) => (
          <li
            key={event.id}
            className={styles.item}
            data-accent={event.accent}
          >
            <span className={styles.dot} aria-hidden="true" />
            <div className={styles.body}>
              <p className={styles.date}>
                <span className={styles.year}>{event.year}</span>
                <span className={styles.bullet}>·</span>
                <span>{event.dateLabel}</span>
              </p>
              <p className={styles.title}>{event.title}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  )
}
