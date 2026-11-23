import { useEffect, useState } from 'react'
import { useParams } from 'react-router'

import type { OlympiadRegistration } from '@/entities/olympiad'
import { olympiadApi, siteSettingsApi, type ContactsSetting } from '@/shared/api'
import { DEFAULT_CONTACTS_SETTING } from '@/shared/api/site-settings'
import { useAuth } from '@/shared/auth'
import { Alert } from '@/shared/ui/alert/Alert'
import { Button } from '@/shared/ui/button/Button'
import { Container } from '@/shared/ui/container/Container'
import { PageHeader } from '@/shared/ui/page-header/PageHeader'
import { PageLayout } from '@/shared/ui/page-layout/PageLayout'
import { Spinner } from '@/shared/ui/spinner/Spinner'
import { Footer } from '@/widgets/footer'
import { Header } from '@/widgets/header'

import styles from './TestingPage.module.css'

/**
 * Точка входа в отборочное тестирование по профилю. Сюда участник попадает
 * сразу после регистрации; доступ — только при наличии регистрации на профиль.
 * Сами задания подключаются модулем тестирования.
 */
export function TestingPage() {
  const { profileId } = useParams()
  const { user } = useAuth()
  const userId = user?.id ?? null

  const [registration, setRegistration] = useState<OlympiadRegistration | null>(
    null,
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [contacts, setContacts] = useState<ContactsSetting>(
    DEFAULT_CONTACTS_SETTING,
  )

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    olympiadApi.listMyRegistrations(userId).then((res) => {
      if (cancelled) return
      setRegistration(
        res.data?.find((item) => item.profileId === profileId) ?? null,
      )
      setError(res.error)
      setIsLoading(false)
    })
    siteSettingsApi.fetchSiteSettings().then((res) => {
      if (cancelled || !res.data) return
      setContacts(res.data.contacts)
    })
    return () => {
      cancelled = true
    }
  }, [userId, profileId])

  const profile = registration?.profile ?? null

  let body
  if (isLoading) {
    body = <Spinner label="Открываем тестирование..." />
  } else if (error) {
    body = (
      <Alert variant="error" title="Ошибка загрузки">
        {error}
      </Alert>
    )
  } else if (!registration) {
    body = (
      <div className={styles.stack}>
        <Alert variant="warning" title="Вы не зарегистрированы на этот профиль">
          Чтобы пройти тестирование, сначала зарегистрируйтесь на профиль
          олимпиады.
        </Alert>
        <div className={styles.actions}>
          <Button to={`/registration?profile=${profileId ?? ''}`}>
            Зарегистрироваться
          </Button>
        </div>
      </div>
    )
  } else if (profile && profile.availability !== 'open') {
    body = (
      <div className={styles.stack}>
        <Alert variant="warning" title="Тестирование сейчас закрыто">
          {profile.availability === 'upcoming'
            ? 'Тестирование по этому профилю ещё не началось.'
            : 'Тестирование по этому профилю завершено.'}
        </Alert>
        <div className={styles.actions}>
          <Button to="/account/olympiads" variant="secondary">
            В личный кабинет
          </Button>
        </div>
      </div>
    )
  } else {
    body = (
      <div className={styles.stack}>
        <Alert variant="success" title="Вы зарегистрированы на профиль">
          Регистрация сохранена в вашем личном кабинете.
        </Alert>
        <Alert variant="info">
          Задания отборочного тестирования появятся на этой странице.
        </Alert>
        <div className={styles.actions}>
          <Button to="/account/olympiads" variant="secondary">
            В личный кабинет
          </Button>
        </div>
      </div>
    )
  }

  return (
    <PageLayout header={<Header />} footer={<Footer contacts={contacts} />}>
      <PageHeader
        eyebrow="Отборочное тестирование"
        title={profile ? profile.profileTitle : 'Тестирование по профилю'}
        description={
          profile ? `${profile.olympiadTitle} · ${profile.season}` : undefined
        }
      />
      <Container className={styles.container}>{body}</Container>
    </PageLayout>
  )
}
