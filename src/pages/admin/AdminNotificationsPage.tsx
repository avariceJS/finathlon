import { useState } from 'react'

import { adminApi } from '@/shared/api'
import { Alert } from '@/shared/ui/alert/Alert'
import { Button } from '@/shared/ui/button/Button'
import { Card } from '@/shared/ui/card/Card'
import { TextField } from '@/shared/ui/text-field/TextField'
import { AdminLayout } from '@/widgets/admin-layout'

import styles from './admin-form.module.css'

export function AdminNotificationsPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [documentUrl, setDocumentUrl] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [info, setInfo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!title.trim()) return
    setIsSending(true)
    setInfo(null)
    setError(null)
    const result = await adminApi.broadcastNotification({
      title: title.trim(),
      description: description.trim() || undefined,
      documentUrl: documentUrl.trim() || null,
    })
    setIsSending(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setInfo(
      `Уведомление отправлено ${result.data?.inserted ?? 0} пользователям.`,
    )
    setTitle('')
    setDescription('')
    setDocumentUrl('')
  }

  return (
    <AdminLayout
      title="Рассылка уведомлений"
      description="Сообщения сразу попадают в раздел «Уведомления» в личных кабинетах."
    >
      <Card padded={false}>
        <form className={styles.form} onSubmit={handleSubmit}>
          {info ? <Alert variant="success">{info}</Alert> : null}
          {error ? <Alert variant="error">{error}</Alert> : null}

          <TextField
            label="Заголовок"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextField
            multiline
            label="Описание"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
          <TextField
            label="Ссылка на документ"
            value={documentUrl}
            onChange={(e) => setDocumentUrl(e.target.value)}
            placeholder="https://"
          />

          <div className={styles.formActions}>
            <Button type="submit" loading={isSending}>
              Отправить всем пользователям
            </Button>
          </div>
        </form>
      </Card>
    </AdminLayout>
  )
}
