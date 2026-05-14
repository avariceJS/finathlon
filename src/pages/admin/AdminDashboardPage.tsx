import { useEffect, useState } from 'react'
import { Link } from 'react-router'

import {
  adminApi,
  councilApi,
  documentsApi,
  faqsApi,
  newsApi,
  partnersApi,
  programsApi,
  statsApi,
  timelineApi,
} from '@/shared/api'
import { Alert } from '@/shared/ui/alert/Alert'
import { Spinner } from '@/shared/ui/spinner/Spinner'
import { AdminLayout } from '@/widgets/admin-layout'

import styles from './AdminDashboardPage.module.css'

type DashboardCounts = {
  news: number
  programs: number
  partners: number
  council: number
  documents: number
  faqs: number
  timeline: number
  stats: number
  users: number
}

const EMPTY: DashboardCounts = {
  news: 0,
  programs: 0,
  partners: 0,
  council: 0,
  documents: 0,
  faqs: 0,
  timeline: 0,
  stats: 0,
  users: 0,
}

export function AdminDashboardPage() {
  const [counts, setCounts] = useState<DashboardCounts>(EMPTY)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    Promise.all([
      newsApi.listNews({ includeUnpublished: true }),
      programsApi.listPrograms({ includeUnpublished: true }),
      partnersApi.listPartners({ includeUnpublished: true }),
      councilApi.listCouncil({ includeUnpublished: true }),
      documentsApi.listDocuments({ includeUnpublished: true }),
      faqsApi.listFaqs({ includeUnpublished: true }),
      timelineApi.listTimeline({ includeUnpublished: true }),
      statsApi.listStats({ includeUnpublished: true }),
      adminApi.listProfiles(),
    ])
      .then((results) => {
        if (cancelled) return
        const [
          news,
          programs,
          partners,
          council,
          documents,
          faqs,
          timeline,
          stats,
          users,
        ] = results

        const anyError = results.find((res) => res.error)?.error
        setError(anyError ?? null)
        setCounts({
          news: news.data?.length ?? 0,
          programs: programs.data?.length ?? 0,
          partners: partners.data?.length ?? 0,
          council: council.data?.length ?? 0,
          documents: documents.data?.length ?? 0,
          faqs: faqs.data?.length ?? 0,
          timeline: timeline.data?.length ?? 0,
          stats: stats.data?.length ?? 0,
          users: users.data?.length ?? 0,
        })
        setIsLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : String(err))
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const tiles: Array<{
    label: string
    value: number
    to: string
    description: string
  }> = [
    {
      label: 'Новости',
      value: counts.news,
      to: '/admin/news',
      description: 'Публикации и черновики',
    },
    {
      label: 'Программы',
      value: counts.programs,
      to: '/admin/programs',
      description: 'Карточки мероприятий на главной',
    },
    {
      label: 'Партнёры',
      value: counts.partners,
      to: '/admin/partners',
      description: 'Организаторы и спонсоры',
    },
    {
      label: 'Совет',
      value: counts.council,
      to: '/admin/council',
      description: 'Попечительский совет',
    },
    {
      label: 'Документы',
      value: counts.documents,
      to: '/admin/documents',
      description: 'Регламенты и шаблоны',
    },
    {
      label: 'FAQ',
      value: counts.faqs,
      to: '/admin/faqs',
      description: 'Вопросы и ответы',
    },
    {
      label: 'Таймлайн',
      value: counts.timeline,
      to: '/admin/timeline',
      description: 'События на главной',
    },
    {
      label: 'Статистика',
      value: counts.stats,
      to: '/admin/stats',
      description: 'Числа на главной странице',
    },
    {
      label: 'Пользователи',
      value: counts.users,
      to: '/admin/users',
      description: 'Управление профилями и ролями',
    },
  ]

  return (
    <AdminLayout
      title="Обзор"
      description="Быстрый доступ ко всем разделам админки."
    >
      {error ? (
        <Alert variant="error" title="Не все счётчики загрузились">
          {error}
        </Alert>
      ) : null}

      {isLoading ? (
        <Spinner label="Загружаем статистику..." />
      ) : (
        <div className={styles.grid}>
          {tiles.map((tile) => (
            <Link key={tile.label} to={tile.to} className={styles.tile}>
              <span className={styles.label}>{tile.label}</span>
              <span className={styles.value}>{tile.value}</span>
              <span className={styles.description}>{tile.description}</span>
            </Link>
          ))}
        </div>
      )}
    </AdminLayout>
  )
}
