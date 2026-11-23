import { useEffect, useRef, useState, type FormEvent } from 'react'

import { updateDemoQuestion } from '@/entities/demo-test/api'
import {
  DEMO_KINDS,
  demoOptions,
  demoSolutions,
  validateDemoQuestion,
  type DemoKind,
  type DemoQuestion,
} from '@/entities/demo-test/model'
import { Alert } from '@/shared/ui/alert/Alert'
import { Button } from '@/shared/ui/button/Button'
import { Select } from '@/shared/ui/select/Select'
import { TextField } from '@/shared/ui/text-field/TextField'

import styles from './AdminDemo.module.css'

export function DemoQuestionEditor({
  question,
  onSave,
  onClose,
}: {
  question: DemoQuestion
  onSave: (value: DemoQuestion) => void
  onClose: () => void
}) {
  const { body } = question
  const [kind, setKind] = useState(body.kind)
  const [prompt, setPrompt] = useState(body.prompt)
  const [explanation, setExplanation] = useState(body.explanation)
  const [points, setPoints] = useState(String(body.points))
  const [solution, setSolution] = useState(
    body.solutions.join(body.kind === 'short' ? '; ' : ', '),
  )
  const [choices, setChoices] = useState(
    body.options.length
      ? body.options.map((text, index) => ({
          text,
          match: body.counterparts[index] ?? '',
        }))
      : [
          { text: '', match: '' },
          { text: '', match: '' },
        ],
  )
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const title = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    title.current?.focus()
  }, [])

  function changeKind(next: DemoKind) {
    if (next === kind) return
    if (next === 'short' || kind === 'short') setSolution('')
    setKind(next)
  }

  function editChoice(index: number, field: 'text' | 'match', value: string) {
    setChoices((previous) =>
      previous.map((choice, row) =>
        row === index ? { ...choice, [field]: value } : choice,
      ),
    )
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    setError('')
    const next = {
      kind,
      prompt: prompt.trim(),
      explanation: explanation.trim(),
      points: Number(points),
      options:
        kind === 'short' ? [] : choices.map((choice) => choice.text.trim()),
      counterparts:
        kind === 'matching' ? choices.map((choice) => choice.match.trim()) : [],
      solutions:
        kind === 'matching' || kind === 'sequence'
          ? []
          : demoSolutions(kind, solution),
    }
    const errors = validateDemoQuestion(next)
    if (errors.length) {
      setError(errors.join(' '))
      return
    }
    setSaving(true)
    try {
      onSave(await updateDemoQuestion({ ...question, body: next }))
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Не удалось сохранить вопрос.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      className={styles.panel}
      onSubmit={save}
      aria-labelledby="demo-edit-title"
    >
      <h3 id="demo-edit-title" ref={title} tabIndex={-1}>
        Редактирование вопроса №{question.number}
      </h3>
      <div className={styles.fields}>
        <Select
          label="Тип задания"
          value={kind}
          options={demoOptions(DEMO_KINDS)}
          onChange={(event) => changeKind(event.target.value as DemoKind)}
        />
        <TextField
          label="Баллы"
          type="number"
          min={1}
          max={100}
          step={1}
          required
          value={points}
          onChange={(event) => setPoints(event.target.value)}
        />
      </div>
      <TextField
        label="Текст вопроса"
        multiline
        rows={3}
        maxLength={10000}
        required
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
      />
      {kind !== 'short' && (
        <div className={styles.stack}>
          <h4>
            {kind === 'matching'
              ? 'Пары в правильном соответствии'
              : kind === 'sequence'
                ? 'Варианты в правильной последовательности'
                : 'Варианты ответа'}
          </h4>
          {choices.map((choice, index) => (
            <div className={styles.choiceRow} key={index}>
              <TextField
                label={`Вариант ${index + 1}`}
                multiline
                rows={2}
                maxLength={2000}
                required
                value={choice.text}
                onChange={(event) =>
                  editChoice(index, 'text', event.target.value)
                }
              />
              {kind === 'matching' && (
                <TextField
                  label={`Соответствие ${index + 1}`}
                  multiline
                  rows={2}
                  maxLength={2000}
                  required
                  value={choice.match}
                  onChange={(event) =>
                    editChoice(index, 'match', event.target.value)
                  }
                />
              )}
            </div>
          ))}
          <div className={styles.actions}>
            <Button
              variant="secondary"
              disabled={choices.length >= 6}
              onClick={() =>
                setChoices((previous) => [...previous, { text: '', match: '' }])
              }
            >
              Добавить вариант
            </Button>
            <Button
              variant="secondary"
              disabled={choices.length <= 2}
              onClick={() => setChoices((previous) => previous.slice(0, -1))}
            >
              Убрать последний
            </Button>
          </div>
        </div>
      )}
      {kind !== 'matching' && kind !== 'sequence' && (
        <TextField
          label="Правильный ответ"
          required
          value={solution}
          hint={
            kind === 'short'
              ? 'Допустимые ответы разделяйте точкой с запятой.'
              : kind === 'multiple'
                ? 'Перечислите номера верных вариантов через запятую.'
                : 'Введите номер верного варианта.'
          }
          onChange={(event) => setSolution(event.target.value)}
        />
      )}
      <TextField
        label="Пояснение"
        multiline
        rows={3}
        maxLength={10000}
        required
        value={explanation}
        onChange={(event) => setExplanation(event.target.value)}
      />
      {error && <Alert variant="error">{error}</Alert>}
      <div className={styles.actions}>
        <Button type="submit" disabled={saving}>
          {saving ? 'Сохраняем…' : 'Сохранить вопрос'}
        </Button>
        <Button disabled={saving} variant="secondary" onClick={onClose}>
          Отмена
        </Button>
      </div>
    </form>
  )
}
