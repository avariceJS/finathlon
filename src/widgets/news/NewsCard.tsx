import { Link } from 'react-router'

import type { NewsArticle } from '@/entities/news'
import { formatDate } from '@/shared/lib/format'

import styles from './NewsCard.module.css'

type NewsCardProps = {
  article: NewsArticle
}

export function NewsCard({ article }: NewsCardProps) {
  return (
    <Link to={`/news/${article.slug}`} className={styles.card}>
      <div className={styles.cover}>
        {article.coverUrl ? (
          <img src={article.coverUrl} alt="" />
        ) : (
          <span className={styles.placeholder}>Финатлон</span>
        )}
      </div>
      <div className={styles.body}>
        <p className={styles.date}>{formatDate(article.publishedAt)}</p>
        <h3 className={styles.title}>{article.title}</h3>
        {article.summary ? (
          <p className={styles.summary}>{article.summary}</p>
        ) : null}
        {article.authorName ? (
          <p className={styles.author}>{article.authorName}</p>
        ) : null}
      </div>
    </Link>
  )
}
