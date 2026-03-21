import type { FaqItem as FaqItemType } from '@/pages/home/model/types'
import { Section } from '@/shared/ui/section/Section'

import { FaqItem } from './FaqItem'
import styles from './FaqSection.module.css'

type FaqSectionProps = {
  items: FaqItemType[]
}

export function FaqSection({ items }: FaqSectionProps) {
  return (
    <Section title="Вопрос-ответ">
      <div className={styles.list}>
        {items.map((item) => (
          <FaqItem key={item.id} question={item.question} answer={item.answer} />
        ))}
      </div>
    </Section>
  )
}