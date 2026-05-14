import type { NewsArticle } from '@/entities/news'
import { Button } from '@/shared/ui/button/Button'
import { EmptyState } from '@/shared/ui/empty-state/EmptyState'
import { Section } from '@/shared/ui/section/Section'

import { NewsCard } from './NewsCard'
import styles from './NewsSection.module.css'

type NewsSectionProps = {
  news: NewsArticle[]
  showActions?: boolean
}

export function NewsSection({ news, showActions = true }: NewsSectionProps) {
  return (
    <Section
      id="news"
      title="Новости"
      description="Анонсы конкурсов, итоги олимпиад и инсайты экспертов."
      actions={
        showActions ? (
          <Button to="/news" variant="ghost">
            Все новости →
          </Button>
        ) : null
      }
    >
      {news.length === 0 ? (
        <EmptyState
          title="Нет новостей"
          description="Скоро здесь появятся новые публикации."
        />
      ) : (
        <div className={styles.grid}>
          {news.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </Section>
  )
}
