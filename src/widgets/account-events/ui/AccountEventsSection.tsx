import type { AccountEvent } from '@/pages/account/model/types'
import { EventCard } from '@/entities/account/ui/EventCard'

import styles from '../styles/AccountEventsSection.module.css'

type AccountEventsSectionProps = {
  events: AccountEvent[]
}

export function AccountEventsSection({
  events,
}: AccountEventsSectionProps) {
  const groupedEvents = events.reduce<Record<number, AccountEvent[]>>((acc, item) => {
    if (!acc[item.year]) {
      acc[item.year] = []
    }

    acc[item.year].push(item)
    return acc
  }, {})

  const years = Object.keys(groupedEvents)
    .map(Number)
    .sort((a, b) => b - a)

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Мероприятия</h2>

      {years.map((year) => (
        <div key={year} className={styles.yearBlock}>
          <h3 className={styles.yearTitle}>{year}</h3>

          <div className={styles.grid}>
            {groupedEvents[year].map((item) => (
              <EventCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}