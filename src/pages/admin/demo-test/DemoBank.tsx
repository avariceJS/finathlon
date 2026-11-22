import { useEffect, useState } from 'react'

import { listDemoBank } from '@/entities/demo-test/api'
import {
  DEMO_GRADES,
  DEMO_KINDS,
  DEMO_PROFILES,
  DEMO_SIZE,
  demoCategoryMatches,
  type DemoCategory,
  type DemoGrades,
  type DemoProfile,
  type DemoQuestion,
} from '@/entities/demo-test/model'
import { Alert } from '@/shared/ui/alert/Alert'
import { Button } from '@/shared/ui/button/Button'
import { Spinner } from '@/shared/ui/spinner/Spinner'

import { DemoIssues } from './DemoIssues'
import { DemoQuestionEditor } from './DemoQuestionEditor'
import styles from './AdminDemo.module.css'

const categories: DemoCategory[] = (
  Object.keys(DEMO_PROFILES) as DemoProfile[]
).flatMap((profile) =>
  (Object.keys(DEMO_GRADES) as DemoGrades[]).map((grades) => ({
    profile,
    grades,
  })),
)

export function DemoBank() {
  const [bank, setBank] = useState<Awaited<ReturnType<typeof listDemoBank>>>()
  const [category, setCategory] = useState<DemoCategory>(categories[0])
  const [editing, setEditing] = useState<DemoQuestion>()
  const [saved, setSaved] = useState<number>()
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    void listDemoBank()
      .then((value) => {
        if (active) setBank(value)
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : 'Не удалось загрузить банк вопросов.',
          )
      })
    return () => {
      active = false
    }
  }, [])

  if (error) return <Alert variant="error">{error}</Alert>
  if (!bank) return <Spinner label="Загружаем банк вопросов…" />
  const questions = bank.questions.filter((question) =>
    demoCategoryMatches(question, category),
  )
  const report = bank.reports.find((item) =>
    demoCategoryMatches(item, category),
  )
  const needsReview = new Set(
    report?.issues.flatMap((issue) => (issue.number ? [issue.number] : [])),
  )
  const entries = [
    ...new Set([
      ...questions.map((question) => question.number),
      ...needsReview,
    ]),
  ].sort((a, b) => a - b)

  function save(question: DemoQuestion) {
    setBank(
      (previous) =>
        previous && {
          ...previous,
          questions: previous.questions.map((row) =>
            demoCategoryMatches(row, question) && row.number === question.number
              ? question
              : row,
          ),
        },
    )
    setSaved(question.number)
    setEditing(undefined)
  }

  return (
    <>
      <section aria-labelledby="demo-categories-title" className={styles.stack}>
        <h2 id="demo-categories-title">Профили и классы</h2>
        <div className={styles.categories}>
          {categories.map((item) => {
            const count = bank.questions.filter((question) =>
              demoCategoryMatches(question, item),
            ).length
            const last = bank.reports.find((entry) =>
              demoCategoryMatches(entry, item),
            )
            const active = demoCategoryMatches(category, item)
            return (
              <button
                type="button"
                className={styles.category}
                aria-pressed={active}
                key={`${item.profile}/${item.grades}`}
                onClick={() => {
                  setCategory(item)
                  setSaved(undefined)
                  setEditing(undefined)
                }}
              >
                <strong>{DEMO_PROFILES[item.profile]}</strong>
                <span>
                  {DEMO_GRADES[item.grades]} · {count} из {DEMO_SIZE} в банке
                </span>
                <span
                  className={count === DEMO_SIZE ? styles.good : styles.muted}
                >
                  {count === DEMO_SIZE ? 'Тест доступен' : 'Тест ещё не готов'}
                </span>
                {last && (
                  <span className={styles.muted}>
                    Последний импорт: {last.uploaded} из {last.found} ·
                    пропущено {last.found - last.uploaded}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </section>
      <section className={styles.stack} aria-labelledby="demo-bank-title">
        <h2 id="demo-bank-title">
          {DEMO_PROFILES[category.profile]} · {DEMO_GRADES[category.grades]}
        </h2>
        {report && <DemoIssues issues={report.issues} />}
        {saved !== undefined && (
          <Alert variant="success">Вопрос №{saved} сохранён.</Alert>
        )}
        {editing && (
          <DemoQuestionEditor
            key={editing.number}
            question={editing}
            onSave={save}
            onClose={() => setEditing(undefined)}
          />
        )}
        {!entries.length ? (
          <div className={styles.panel}>
            <p>В этой категории пока нет вопросов.</p>
            <div className={styles.actions}>
              <Button to="/admin/demo-test/import">Импорт Excel</Button>
            </div>
          </div>
        ) : (
          <ul className={styles.questionList}>
            {entries.map((number) => {
              const question = questions.find((item) => item.number === number)
              return (
                <li key={number}>
                  <div className={styles.stack}>
                    <p className={styles.muted}>
                      №{number}
                      {question && (
                        <>
                          {' '}
                          · {DEMO_KINDS[question.body.kind]} ·{' '}
                          {question.body.points} балл.
                        </>
                      )}
                    </p>
                    {question && (
                      <p className={styles.prompt}>{question.body.prompt}</p>
                    )}
                    {needsReview.has(number) ? (
                      <span className={styles.reviewNeeded}>
                        Строка импорта требует проверки
                        {question && ' · версия в банке готова'}
                      </span>
                    ) : (
                      <span className={styles.good}>Готов</span>
                    )}
                  </div>
                  {question && (
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-label={`Редактировать вопрос №${number}`}
                      onClick={() => {
                        setSaved(undefined)
                        setEditing(question)
                      }}
                    >
                      Редактировать
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </>
  )
}
