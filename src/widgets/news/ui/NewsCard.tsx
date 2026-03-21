import type { NewsItem } from '@/pages/home/model/types'

import styles from './NewsCard.module.css'

type NewsCardProps = {
  item: NewsItem
}

export function NewsCard({ item }: NewsCardProps) {
  return (
    <a className={styles.card} href={item.href}>
      <div className={styles.image} aria-label={item.imageAlt}>
        <span className={styles.imageText}>Изображение</span>
      </div>

      <div className={styles.footer}>
        <h3 className={styles.title}>{item.title}</h3>
      </div>
    </a>
  )
}