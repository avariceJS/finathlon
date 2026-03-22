import type { NewsItem } from '@/pages/home/model/types'
import { Section } from '@/shared/ui/section/Section'

import { NewsCard } from './NewsCard'
import styles from '../styles/NewsSection.module.css'

type NewsSectionProps = {
  items: NewsItem[]
}

export function NewsSection({ items }: NewsSectionProps) {
  return (
    <Section title="Новости" id="news">
      <div className={styles.grid}>
        {items.map((item) => (
          <NewsCard key={item.id} item={item} />
        ))}
      </div>
    </Section>
  )
}