import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router'

import { finishDemo, startDemo } from '@/entities/demo-test/api'
import {
  DEMO_GRADES,
  DEMO_PROFILES,
  type DemoCategory,
  type DemoResult,
  type DemoSession,
} from '@/entities/demo-test/model'
import { useAuth } from '@/shared/auth'
import {
  DEFAULT_CONTACTS_SETTING,
  fetchSiteSettings,
} from '@/shared/api/site-settings'
import { Alert } from '@/shared/ui/alert/Alert'
import { Button } from '@/shared/ui/button/Button'
import { Container } from '@/shared/ui/container/Container'
import { PageLayout } from '@/shared/ui/page-layout/PageLayout'
import { TextField } from '@/shared/ui/text-field/TextField'
import { Footer } from '@/widgets/footer'
import { Header } from '@/widgets/header'

import { DemoQuestion } from './DemoQuestion'
import { DemoResultView } from './DemoResultView'
import styles from './DemoTest.module.css'

function Quiz({ category }: { category: DemoCategory }) {
  const { profile } = useAuth()
  const [region, setRegion] = useState('')
  const [cityInput, setCity] = useState<string>()
  const [session, setSession] = useState<DemoSession>()
  const [answers, setAnswers] = useState<string[][]>([])
  const [result, setResult] = useState<DemoResult>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const city = cityInput ?? profile?.city ?? ''
  const question = session?.questions[answers.length]

  async function begin(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    if (busy || !region.trim() || !city.trim()) return
    setBusy(true)
    setError('')
    try {
      const nextSession = await startDemo(category, region.trim(), city.trim())
      setCity(city)
      setSession(nextSession)
      setAnswers([])
      setResult(undefined)
      window.scrollTo({ top: 0, behavior: 'instant' })
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Не удалось начать демо-тест.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function advance(answer: string[]) {
    if (!session || busy) return
    const nextAnswers = [...answers, answer]
    if (nextAnswers.length < session.questions.length) {
      setAnswers(nextAnswers)
      window.scrollTo({ top: 0, behavior: 'instant' })
      return
    }
    setError('')
    setBusy(true)
    try {
      setResult(await finishDemo(session.id, nextAnswers))
      window.scrollTo({ top: 0, behavior: 'instant' })
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Не удалось сохранить результат.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <p className={styles.subtitle}>
        {DEMO_PROFILES[category.profile]} · {DEMO_GRADES[category.grades]}
      </p>
      {result ? (
        <DemoResultView
          result={result}
          busy={busy}
          error={error}
          onRestart={() => void begin()}
        />
      ) : session && question ? (
        <DemoQuestion
          key={question.number}
          question={question}
          total={session.questions.length}
          busy={busy}
          error={error}
          onAnswer={(answer) => void advance(answer)}
        />
      ) : (
        <form
          className={styles.panel}
          onSubmit={begin}
          aria-label="Начало теста"
        >
          <h2>Укажите регион и город</h2>
          <p className={styles.muted}>
            Они нужны для статистики прохождения теста.
          </p>
          <div className={styles.fields}>
            <TextField
              label="Регион"
              required
              maxLength={120}
              value={region}
              onChange={(event) => setRegion(event.target.value)}
            />
            <TextField
              label="Город"
              required
              maxLength={120}
              value={city}
              onChange={(event) => setCity(event.target.value)}
            />
          </div>
          {error && <Alert variant="error">{error}</Alert>}
          <div className={styles.actions}>
            <Button
              type="submit"
              disabled={busy || !region.trim() || !city.trim()}
            >
              {busy ? 'Загружаем вопросы…' : 'Начать тест'}
            </Button>
          </div>
        </form>
      )}
    </>
  )
}

export function DemoTestPage() {
  const [params] = useSearchParams()
  const [contacts, setContacts] = useState(DEFAULT_CONTACTS_SETTING)
  const profile = params.get('profile') ?? ''
  const grades = params.get('grades') ?? ''
  const validCategory =
    Object.hasOwn(DEMO_PROFILES, profile) && Object.hasOwn(DEMO_GRADES, grades)

  useEffect(() => {
    let active = true
    void fetchSiteSettings().then(({ data }) => {
      if (active && data) setContacts(data.contacts)
    })
    return () => {
      active = false
    }
  }, [])

  return (
    <PageLayout header={<Header />} footer={<Footer contacts={contacts} />}>
      <Container className={styles.quiz}>
        <h1>Демо-тестирование</h1>
        {validCategory ? (
          <Quiz
            key={`${profile}/${grades}`}
            category={{ profile, grades } as DemoCategory}
          />
        ) : (
          <div className={styles.panel}>
            <p>
              Выберите профиль и классы в разделе демо-тестирования на главной
              странице.
            </p>
            <div className={styles.actions}>
              <Button to="/">На главную</Button>
            </div>
          </div>
        )}
      </Container>
    </PageLayout>
  )
}
