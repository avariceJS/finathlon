import type { DemoMistake, DemoResult } from '@/entities/demo-test/model'
import { Alert } from '@/shared/ui/alert/Alert'
import { Button } from '@/shared/ui/button/Button'

import styles from './DemoTest.module.css'

function readableAnswer(question: DemoMistake, values: string[]) {
  if (question.kind === 'short') return values.join(' / ')
  if (question.kind === 'matching') {
    return values
      .map(
        (value, index) =>
          `${question.options[index]} — ${question.counterparts[Number(value) - 1]}`,
      )
      .join('\n')
  }
  return values.map((value) => question.options[Number(value) - 1]).join('\n')
}

export function DemoResultView({
  result,
  busy,
  error,
  onRestart,
}: {
  result: DemoResult
  busy: boolean
  error: string
  onRestart: () => void
}) {
  return (
    <>
      <section className={styles.panel} aria-labelledby="demo-result-title">
        <h2 id="demo-result-title">Результат теста</h2>
        <div className={styles.metrics}>
          <div>
            <strong>
              {result.correctCount} из {result.questionCount}
            </strong>
            <span>Правильных ответов</span>
          </div>
          <div>
            <strong>
              {result.score} из {result.maxScore}
            </strong>
            <span>Набрано баллов</span>
          </div>
        </div>
        {error && <Alert variant="error">{error}</Alert>}
        <div className={styles.actions}>
          <Button onClick={onRestart} disabled={busy}>
            {busy ? 'Загружаем вопросы…' : 'Пройти тест ещё раз'}
          </Button>
          <Button to="/" variant="secondary">
            На главную
          </Button>
        </div>
      </section>
      <section className={styles.stack} aria-labelledby="demo-review-title">
        <h2 id="demo-review-title">Разбор ошибок</h2>
        {!result.mistakes.length && (
          <p>Вы ответили правильно на все вопросы.</p>
        )}
        {result.mistakes.map((question) => (
          <article className={styles.panel} key={question.number}>
            <h3 className={styles.question}>
              Вопрос {question.number}. {question.prompt}
            </h3>
            <dl className={styles.review}>
              <dt>Ваш ответ</dt>
              <dd>{readableAnswer(question, question.answer)}</dd>
              <dt>Правильный ответ</dt>
              <dd>{readableAnswer(question, question.solutions)}</dd>
              <dt>Пояснение</dt>
              <dd>{question.explanation}</dd>
            </dl>
          </article>
        ))}
      </section>
    </>
  )
}
