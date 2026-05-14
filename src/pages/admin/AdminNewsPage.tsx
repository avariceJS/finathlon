import { useEffect, useState } from 'react'

import type { NewsArticle } from '@/entities/news'
import { newsApi } from '@/shared/api'
import { formatDate } from '@/shared/lib/format'
import { Alert } from '@/shared/ui/alert/Alert'
import { Button } from '@/shared/ui/button/Button'
import { Modal } from '@/shared/ui/modal/Modal'
import { Spinner } from '@/shared/ui/spinner/Spinner'
import { TextField } from '@/shared/ui/text-field/TextField'
import { AdminLayout } from '@/widgets/admin-layout'
import { AdminTable } from '@/widgets/admin-table'

import styles from './admin-form.module.css'

type Mode =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; article: NewsArticle }

type FormState = {
  slug: string
  title: string
  summary: string
  content: string
  coverUrl: string
  authorName: string
  isPublished: boolean
  publishedAt: string
}

const EMPTY: FormState = {
  slug: '',
  title: '',
  summary: '',
  content: '',
  coverUrl: '',
  authorName: '',
  isPublished: true,
  publishedAt: new Date().toISOString().slice(0, 16),
}

export function AdminNewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>({ kind: 'closed' })
  const [form, setForm] = useState<FormState>(EMPTY)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const reload = async () => {
    setIsLoading(true)
    setError(null)
    const res = await newsApi.listNews({ includeUnpublished: true })
    setArticles(res.data ?? [])
    setError(res.error)
    setIsLoading(false)
  }

  useEffect(() => {
    void reload()
  }, [])

  const openCreate = () => {
    setForm(EMPTY)
    setFormError(null)
    setMode({ kind: 'create' })
  }

  const openEdit = (article: NewsArticle) => {
    setForm({
      slug: article.slug,
      title: article.title,
      summary: article.summary,
      content: article.content,
      coverUrl: article.coverUrl ?? '',
      authorName: article.authorName ?? '',
      isPublished: article.isPublished,
      publishedAt: article.publishedAt
        ? new Date(article.publishedAt).toISOString().slice(0, 16)
        : EMPTY.publishedAt,
    })
    setFormError(null)
    setMode({ kind: 'edit', article })
  }

  const closeModal = () => setMode({ kind: 'closed' })

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    setFormError(null)
    const payload = {
      slug: form.slug.trim(),
      title: form.title.trim(),
      summary: form.summary.trim(),
      content: form.content,
      coverUrl: form.coverUrl.trim() || null,
      authorName: form.authorName.trim() || null,
      isPublished: form.isPublished,
      publishedAt: form.publishedAt
        ? new Date(form.publishedAt).toISOString()
        : new Date().toISOString(),
    }
    const result =
      mode.kind === 'create'
        ? await newsApi.createNews(payload)
        : mode.kind === 'edit'
          ? await newsApi.updateNews(mode.article.id, payload)
          : { error: 'Неизвестное действие' as string | null, data: null }
    setIsSaving(false)
    if (result.error) {
      setFormError(result.error)
      return
    }
    closeModal()
    await reload()
  }

  const handleDelete = async (article: NewsArticle) => {
    if (!confirm(`Удалить новость «${article.title}»?`)) return
    const res = await newsApi.deleteNews(article.id)
    if (res.error) {
      setError(res.error)
      return
    }
    await reload()
  }

  return (
    <AdminLayout
      title="Новости"
      description="Управляйте материалами, которые видят пользователи на сайте."
      actions={<Button onClick={openCreate}>+ Новая публикация</Button>}
    >
      {error ? (
        <Alert variant="error" title="Ошибка">
          {error}
        </Alert>
      ) : null}

      {isLoading ? (
        <Spinner label="Загружаем новости..." />
      ) : (
        <AdminTable
          data={articles}
          rowKey={(item) => item.id}
          columns={[
            {
              key: 'title',
              header: 'Заголовок',
              render: (item) => (
                <div>
                  <strong>{item.title}</strong>
                  <div className={styles.muted}>/{item.slug}</div>
                </div>
              ),
            },
            {
              key: 'date',
              header: 'Опубликовано',
              render: (item) => formatDate(item.publishedAt),
              width: '180px',
            },
            {
              key: 'status',
              header: 'Статус',
              render: (item) => (
                <span
                  className={
                    item.isPublished ? styles.badgeOk : styles.badgeMuted
                  }
                >
                  {item.isPublished ? 'Опубликовано' : 'Скрыто'}
                </span>
              ),
              width: '160px',
            },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: (item) => (
                <div className={styles.rowActions}>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEdit(item)}
                  >
                    Редактировать
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(item)}
                  >
                    Удалить
                  </Button>
                </div>
              ),
              width: '240px',
            },
          ]}
        />
      )}

      <Modal isOpen={mode.kind !== 'closed'} onClose={closeModal}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <h2 className={styles.formTitle}>
            {mode.kind === 'create' ? 'Новая публикация' : 'Редактировать'}
          </h2>

          {formError ? (
            <Alert variant="error">{formError}</Alert>
          ) : null}

          <div className={styles.grid2}>
            <TextField
              label="Заголовок"
              required
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            />
            <TextField
              label="Slug"
              required
              hint="Используется в URL, например 'news-2026'"
              value={form.slug}
              onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
            />
          </div>

          <TextField
            multiline
            label="Краткое описание"
            value={form.summary}
            onChange={(e) =>
              setForm((p) => ({ ...p, summary: e.target.value }))
            }
            rows={3}
          />

          <TextField
            multiline
            label="Текст публикации"
            value={form.content}
            onChange={(e) =>
              setForm((p) => ({ ...p, content: e.target.value }))
            }
            rows={8}
          />

          <div className={styles.grid2}>
            <TextField
              label="Обложка (URL)"
              value={form.coverUrl}
              onChange={(e) =>
                setForm((p) => ({ ...p, coverUrl: e.target.value }))
              }
            />
            <TextField
              label="Автор"
              value={form.authorName}
              onChange={(e) =>
                setForm((p) => ({ ...p, authorName: e.target.value }))
              }
            />
          </div>

          <div className={styles.grid2}>
            <TextField
              label="Дата публикации"
              type="datetime-local"
              value={form.publishedAt}
              onChange={(e) =>
                setForm((p) => ({ ...p, publishedAt: e.target.value }))
              }
            />
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) =>
                  setForm((p) => ({ ...p, isPublished: e.target.checked }))
                }
              />
              <span>Опубликовано</span>
            </label>
          </div>

          <div className={styles.formActions}>
            <Button type="button" variant="ghost" onClick={closeModal}>
              Отмена
            </Button>
            <Button type="submit" loading={isSaving}>
              {mode.kind === 'create' ? 'Опубликовать' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  )
}
