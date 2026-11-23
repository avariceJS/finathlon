import { useEffect, useRef, useState, type FormEvent } from 'react'

import {
  DEMO_KINDS,
  type DemoKind,
  type DemoPublicQuestion,
} from '@/entities/demo-test/model'
import { Alert } from '@/shared/ui/alert/Alert'
import { Button } from '@/shared/ui/button/Button'
import { Select } from '@/shared/ui/select/Select'
import { TextField } from '@/shared/ui/text-field/TextField'

import styles from './DemoTest.module.css'

const instructions: Record<DemoKind, string> = {
  single: 'Выберите один вариант.',
  multiple: 'Отметьте все подходящие варианты.',
  matching: 'Подберите один из пронумерованных вариантов к каждому пункту.',
  short: 'Введите ответ в поле ниже.',
  sequence: 'Выберите номер пункта для каждой позиции.',
}

export function DemoQuestion({
  question,
  total,
  busy,
  error,
  onAnswer,
}: {
  question: DemoPublicQuestion
  total: number
  busy: boolean
  error: string
  onAnswer: (answer: string[]) => void
}) {
  const [answer, setAnswer] = useState<string[]>([])
  const heading = useRef<HTMLHeadingElement>(null)
  const { number, kind, prompt, options, counterparts } = question
  const grouped = kind === 'matching' || kind === 'sequence'
  const choices = kind === 'matching' ? counterparts : options
  const complete = grouped
    ? answer.filter(Boolean).length === options.length &&
      new Set(answer).size === options.length
    : Boolean(answer[0]?.trim())

  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
  }, [])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!complete || busy) return
    onAnswer(answer.map((value) => value.trim()))
  }

  return (
    <section className={styles.panel} aria-labelledby="demo-question-title">
      <div className={styles.stack}>
        <div className={styles.progressLabel}>
          <span>
            Вопрос {number} из {total}
          </span>
          <span>Отвечено {number - 1}</span>
        </div>
        <progress
          className={styles.progress}
          aria-label="Прогресс теста"
          value={number - 1}
          max={total}
        />
      </div>
      <div className={styles.stack}>
        <p className={styles.kind}>{DEMO_KINDS[kind]}</p>
        <h2
          id="demo-question-title"
          tabIndex={-1}
          ref={heading}
          className={styles.question}
        >
          {prompt}
        </h2>
        <p className={styles.muted}>{instructions[kind]}</p>
      </div>

      <form className={styles.stack} onSubmit={submit}>
        {kind === 'short' ? (
          <TextField
            label="Ваш ответ"
            value={answer[0] ?? ''}
            maxLength={2000}
            onChange={(event) => setAnswer([event.target.value])}
          />
        ) : grouped ? (
          <>
            <ol className={styles.choices}>
              {choices.map((option, index) => (
                <li key={index}>{option}</li>
              ))}
            </ol>
            {options.map((option, index) => (
              <Select
                key={index}
                label={kind === 'matching' ? option : `Позиция ${index + 1}`}
                placeholder="Выберите номер"
                value={answer[index] ?? ''}
                options={choices.map((_, choice) => ({
                  value: String(choice + 1),
                  label: `Вариант ${choice + 1}`,
                }))}
                onChange={(event) => {
                  const value = event.target.value
                  setAnswer((previous) =>
                    options.map((_, row) =>
                      row === index
                        ? value
                        : previous[row] === value
                          ? ''
                          : (previous[row] ?? ''),
                    ),
                  )
                }}
              />
            ))}
          </>
        ) : (
          <fieldset className={styles.answerGroup}>
            <legend className={styles.visuallyHidden}>Варианты ответа</legend>
            {options.map((option, index) => {
              const value = String(index + 1)
              return (
                <label className={styles.answerOption} key={index}>
                  <input
                    type={kind === 'single' ? 'radio' : 'checkbox'}
                    name="answer"
                    checked={answer.includes(value)}
                    onChange={() =>
                      setAnswer((previous) =>
                        kind === 'single'
                          ? [value]
                          : previous.includes(value)
                            ? previous.filter((item) => item !== value)
                            : [...previous, value],
                      )
                    }
                  />
                  <span>{option}</span>
                </label>
              )
            })}
          </fieldset>
        )}
        {error && <Alert variant="error">{error}</Alert>}
        <div className={styles.actions}>
          <Button type="submit" disabled={!complete || busy}>
            {busy
              ? 'Проверяем ответы…'
              : number === total
                ? 'Завершить тест'
                : 'Далее'}
          </Button>
        </div>
      </form>
    </section>
  )
}
