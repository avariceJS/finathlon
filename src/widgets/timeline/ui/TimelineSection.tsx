import type { TimelineItem } from '@/pages/home/model/types'
import { Section } from '@/shared/ui/section/Section'

import styles from '../styles/TimelineSection.module.css'

type TimelineSectionProps = {
  items: TimelineItem[]
}

export function TimelineSection({ items }: TimelineSectionProps) {
  const years = [...new Set(items.map((item) => item.year))]

  return (
    <Section title="Таймлайн событий">
      <div className={styles.timeline}>
        <div className={styles.track} />

        {items.map((item) => (
          <article
            key={item.id}
            className={styles.event}
            style={{ left: item.position }}
          >
            <div className={styles.markerWrap}>
              <span
                className={
                  item.accent === 'red' ? styles.markerRed : styles.markerBlue
                }
              />
            </div>

            <div className={styles.eventCard}>
              <div className={styles.eventDate}>{item.date}</div>
              <div className={styles.eventLabel}>{item.label}</div>
            </div>
          </article>
        ))}

        <div className={styles.years}>
          {years.map((year) => (
            <span key={year} className={styles.year}>
              {year}
            </span>
          ))}
        </div>
      </div>
    </Section>
  )
}