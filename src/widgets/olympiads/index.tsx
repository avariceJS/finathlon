import type { Olympiad } from '@/entities/olympiad'
import { getRegistrationState } from '@/entities/olympiad/registration'
import { Button } from '@/shared/ui/button/Button'
import { Container } from '@/shared/ui/container/Container'
import { sanitizeRichText } from '@/shared/lib/richText'

import styles from './OlympiadsSection.module.css'

const REGISTRATION_LABELS = {
  upcoming: 'Ожидается открытие регистрации',
  open: 'Открыта регистрация',
  closed: 'Регистрация завершена',
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
}

export function OlympiadsSection({ olympiads }: { olympiads: Olympiad[] }) {
  const published = olympiads.filter(
    (item) => item.isPublished && item.status === 'published',
  )
  if (published.length === 0) return null

  return (
    <section className={styles.section} aria-labelledby="olympiads-title">
      <Container>
        <header className={styles.heading}>
          <h2 id="olympiads-title">Олимпиады и профили</h2>
          <p>Профили, сроки и условия участия в олимпиадах.</p>
        </header>
        <div className={styles.grid}>
          {published.map((olympiad) => {
            const registration = getRegistrationState(olympiad)
            return (
              <article key={olympiad.id} className={styles.card}>
                <div className={styles.badges}>
                  {olympiad.season ? (
                    <span>Сезон {olympiad.season}</span>
                  ) : null}
                  <span>{REGISTRATION_LABELS[registration]}</span>
                </div>
                <h3>{olympiad.title}</h3>
                {olympiad.profileTitle ? (
                  <h4>{olympiad.profileTitle}</h4>
                ) : null}
                {olympiad.description ? (
                  <p className={styles.description}>{olympiad.description}</p>
                ) : null}
                <dl className={styles.dates}>
                  <div>
                    <dt>Формат:</dt>
                    <dd>
                      {olympiad.format === 'offline' ? 'Очная' : 'Онлайн'}
                    </dd>
                  </div>
                  <div>
                    <dt>Начало:</dt>
                    <dd>{formatDate(olympiad.startDate)}</dd>
                  </div>
                  <div>
                    <dt>Окончание:</dt>
                    <dd>{formatDate(olympiad.endDate)}</dd>
                  </div>
                </dl>
                {olympiad.richContent ? (
                  <details className={styles.details}>
                    <summary>Подробнее об олимпиаде</summary>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: sanitizeRichText(olympiad.richContent),
                      }}
                    />
                  </details>
                ) : null}
                {registration === 'open' ? (
                  <Button to={`/registration?profile=${olympiad.id}`} fullWidth>
                    Зарегистрироваться
                  </Button>
                ) : (
                  <p className={styles.notice}>
                    {registration === 'upcoming'
                      ? `Регистрация начнётся ${formatDate(olympiad.startDate)}`
                      : 'Регистрация завершена'}
                  </p>
                )}
              </article>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
