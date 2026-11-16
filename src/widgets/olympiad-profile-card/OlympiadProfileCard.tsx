import { Button } from '@/shared/ui/button/Button'
import { Card } from '@/shared/ui/card/Card'

import styles from './OlympiadProfileCard.module.css'

export type OlympiadProfileCardProps = {
  title: string
  description: string
  season: string
  startDate: string | null
  endDate: string | null
  status: string
  registrationOpen: boolean
  registrationClosed: boolean
  registrationNotStarted: boolean
  onRegister: () => void
}

export function OlympiadProfileCard({
  title,
  description,
  season,
  startDate,
  endDate,
  status,
  registrationOpen,
  registrationClosed,
  registrationNotStarted,
  onRegister,
}: OlympiadProfileCardProps) {
  const getStatusText = () => {
    switch (status) {
      case 'draft':
        return 'Черновик'
      case 'published':
        return 'Опубликовано'
      case 'completed':
        return 'Завершён'
      case 'archived':
        return 'Архив'
      default:
        return status
    }
  }

  const getRegistrationText = () => {
    if (registrationNotStarted) {
      return 'Регистрация ещё не началась'
    }
    if (registrationClosed) {
      return 'Регистрация завершена'
    }
    if (registrationOpen) {
      return 'Зарегистрироваться и пройти тестирование'
    }
    return 'Регистрация недоступна'
  }

  return (
    <Card className={styles.card} hoverable padded={false}>
      <div className={styles.inner}>
        <header className={styles.head}>
          <h3 className={styles.title}>{title}</h3>
          <span className={styles.status}>{getStatusText()}</span>
        </header>

        {description ? <p className={styles.description}>{description}</p> : null}

        {season ? <div className={styles.season}>Сезон: {season}</div> : null}

        {startDate ? <div className={styles.dates}>Начало: {startDate}</div> : null}
        {endDate ? <div className={styles.dates}>Окончание: {endDate}</div> : null}

        <div className={styles.actions}>
          {registrationOpen ? (
            <Button onClick={onRegister} fullWidth>
              {getRegistrationText()}
            </Button>
          ) : (
            <div className={styles.statusMessage}>{getRegistrationText()}</div>
          )}
        </div>
      </div>
    </Card>
  )
}
