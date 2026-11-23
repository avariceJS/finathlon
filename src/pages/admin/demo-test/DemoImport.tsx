import { useState } from 'react'

import { importDemoBank } from '@/entities/demo-test/api'
import {
  DEMO_GRADES,
  DEMO_PROFILES,
  type DemoImportPreview,
} from '@/entities/demo-test/model'
import { Alert } from '@/shared/ui/alert/Alert'
import { Button } from '@/shared/ui/button/Button'
import { TextField } from '@/shared/ui/text-field/TextField'

import { DemoIssues } from './DemoIssues'
import styles from './AdminDemo.module.css'

export function DemoImport() {
  const [file, setFile] = useState<File>()
  const [preview, setPreview] = useState<DemoImportPreview>()
  const [busy, setBusy] = useState<'checking' | 'importing'>()
  const [complete, setComplete] = useState(false)
  const [error, setError] = useState('')
  const found =
    preview?.reports.reduce((sum, report) => sum + report.found, 0) ?? 0
  const ready = preview?.questions.length ?? 0

  async function checkFile() {
    if (!file || busy) return
    setBusy('checking')
    setError('')
    setPreview(undefined)
    setComplete(false)
    try {
      const { previewDemoWorkbook } =
        await import('@/entities/demo-test/spreadsheet')
      setPreview(await previewDemoWorkbook(file))
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Не удалось проверить файл.',
      )
    } finally {
      setBusy(undefined)
    }
  }

  async function importFile() {
    if (!preview || busy || !preview.reports.length || complete) return
    setBusy('importing')
    setError('')
    try {
      await importDemoBank(preview)
      setComplete(true)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Не удалось импортировать вопросы.',
      )
    } finally {
      setBusy(undefined)
    }
  }

  return (
    <section className={styles.panel} aria-labelledby="demo-import-title">
      <h2 id="demo-import-title">Импорт банка вопросов</h2>
      <p className={styles.muted}>
        Загрузите файл .xlsx по шаблону и проверьте его перед импортом.
        Корректные строки обновят вопросы с теми же номерами.
      </p>
      <div className={styles.actions}>
        <TextField
          label="Файл Excel"
          type="file"
          accept=".xlsx"
          className={styles.fileInput}
          disabled={Boolean(busy)}
          onChange={(event) => {
            setFile(event.target.files?.[0])
            setPreview(undefined)
            setComplete(false)
            setError('')
          }}
        />
        <Button
          disabled={!file || Boolean(busy)}
          onClick={() => void checkFile()}
        >
          {busy === 'checking' ? 'Проверяем…' : 'Проверить'}
        </Button>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      {preview && (
        <div className={styles.stack} aria-live="polite">
          <h3>{complete ? 'Результат импорта' : 'Результат проверки'}</h3>
          <p>
            <strong>Найдено:</strong> {found} ·{' '}
            <strong>{complete ? 'Загружено:' : 'Можно загрузить:'}</strong>{' '}
            {ready} ·{' '}
            <strong>{complete ? 'Не загружено:' : 'Пропущено строк:'}</strong>{' '}
            {found - ready}
          </p>
          {preview.reports.length > 0 && (
            <ul className={styles.simpleList}>
              {preview.reports.map((report) => (
                <li key={`${report.profile}/${report.grades}`}>
                  {DEMO_PROFILES[report.profile]} · {DEMO_GRADES[report.grades]}{' '}
                  — {report.uploaded} из {report.found}
                </li>
              ))}
            </ul>
          )}
          <DemoIssues
            issues={[
              ...preview.fileIssues,
              ...preview.reports.flatMap((report) => report.issues),
            ]}
          />
          <div className={styles.actions}>
            {complete ? (
              <Button to="/admin/demo-test">Открыть банк вопросов</Button>
            ) : (
              preview.reports.length > 0 && (
                <Button
                  disabled={Boolean(busy)}
                  onClick={() => void importFile()}
                >
                  {busy === 'importing'
                    ? 'Сохраняем…'
                    : ready
                      ? 'Подтвердить импорт'
                      : 'Сохранить отчёт об ошибках'}
                </Button>
              )
            )}
          </div>
        </div>
      )}
    </section>
  )
}
