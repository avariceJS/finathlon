import type { UserEvent } from '@/entities/profile'
import { Button } from '@/shared/ui/button/Button'
import { EmptyState } from '@/shared/ui/empty-state/EmptyState'

import styles from './EventsSection.module.css'

type EventsSectionProps = {
  events: UserEvent[]
}

export function EventsSection({ events }: EventsSectionProps) {
  if (events.length === 0) {
    return (
      <EmptyState
        title="Здесь будет история участия"
        description="Когда вы примете участие в мероприятиях Финатлона, они появятся в этом списке."
        actions={<Button to="/events">К списку мероприятий</Button>}
      />
    )
  }

  const grouped = new Map<number, UserEvent[]>()
  for (const event of events) {
    const list = grouped.get(event.year) ?? []
    list.push(event)
    grouped.set(event.year, list)
  }
  const years = Array.from(grouped.keys()).sort((a, b) => b - a)

  return (
    <section className={styles.section}>
      <header className={styles.head}>
        <h2 className={styles.title}>Мои мероприятия</h2>
        <p className={styles.subtitle}>История участия и достижения.</p>
      </header>

      <div className={styles.groups}>
        {years.map((year) => (
          <div key={year} className={styles.group}>
            <h3 className={styles.year}>{year}</h3>
            <div className={styles.grid}>
              {grouped.get(year)?.map((event) => (
                <article key={event.id} className={styles.card}>
                  <span className={styles.date}>{event.dateLabel}</span>
                  <h4 className={styles.eventTitle}>{event.title}</h4>
                  {event.result ? (
                    <p className={styles.result}>{event.result}</p>
                  ) : null}
                  <div className={styles.actions}>
                    {event.publicationUrl ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        href={event.publicationUrl}
                      >
                        Публикация в РИНЦ
                      </Button>
                    ) : null}
                    {event.diplomaUrl ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        href={event.diplomaUrl}
                      >
                        Скачать диплом
                      </Button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
