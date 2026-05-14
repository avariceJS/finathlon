import type { FaqEntry } from '@/entities/faq'
import { EmptyState } from '@/shared/ui/empty-state/EmptyState'
import { Section } from '@/shared/ui/section/Section'

import { FaqItem } from './FaqItem'
import styles from './FaqSection.module.css'

type FaqSectionProps = {
  items: FaqEntry[]
}

export function FaqSection({ items }: FaqSectionProps) {
  return (
    <Section
      id="faq"
      title="Часто задаваемые вопросы"
      description="Ответы на вопросы, которые мы слышим чаще всего."
    >
      {items.length === 0 ? (
        <EmptyState title="Здесь пока пусто" description="Добавьте FAQ через админку." />
      ) : (
        <div className={styles.list}>
          {items.map((entry) => (
            <FaqItem
              key={entry.id}
              question={entry.question}
              answer={entry.answer}
            />
          ))}
        </div>
      )}
    </Section>
  )
}
