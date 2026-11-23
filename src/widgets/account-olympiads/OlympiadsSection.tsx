import type { OlympiadRegistration } from '@/entities/olympiad'
import { formatDate } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button/Button'
import { EmptyState } from '@/shared/ui/empty-state/EmptyState'

import styles from './OlympiadsSection.module.css'

type OlympiadsSectionProps = {
  registrations: OlympiadRegistration[]
}

export function OlympiadsSection({ registrations }: OlympiadsSectionProps) {
  if (registrations.length === 0) {
    return (
      <EmptyState
        title="Вы пока не зарегистрированы ни на один профиль"
        description="Выберите профиль олимпиады и пройдите отборочное тестирование."
        actions={<Button to="/registration">Выбрать профиль</Button>}
      />
    )
  }

  return (
    <section className={styles.section}>
      <header className={styles.head}>
        <h2 className={styles.title}>Мои профили олимпиады</h2>
        <p className={styles.subtitle}>
          Профили, на которые вы зарегистрированы.
        </p>
      </header>

      <div className={styles.grid}>
        {registrations.map(({ id, profileId, createdAt, profile }) => (
          <article key={id} className={styles.card}>
            {profile ? (
              <span className={styles.season}>{profile.season}</span>
            ) : null}
            <h3 className={styles.profileTitle}>
              {profile?.profileTitle ?? 'Профиль олимпиады'}
            </h3>
            {profile ? (
              <p className={styles.olympiad}>{profile.olympiadTitle}</p>
            ) : null}
            <p className={styles.meta}>
              Дата регистрации: {formatDate(createdAt)}
            </p>
            <div className={styles.actions}>
              {profile?.availability === 'open' ? (
                <Button size="sm" to={`/testing/${profileId}`}>
                  Перейти к тестированию
                </Button>
              ) : (
                <span className={styles.status}>
                  {profile?.availability === 'upcoming'
                    ? 'Тестирование ещё не началось'
                    : 'Тестирование завершено'}
                </span>
              )}
            </div>
          </article>
        ))}
      </div>

      <div>
        <Button to="/registration" variant="secondary">
          Зарегистрироваться на другой профиль
        </Button>
      </div>
    </section>
  )
}
