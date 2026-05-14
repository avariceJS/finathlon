import { useState } from 'react'

import { cx } from '@/shared/lib/classNames'

import styles from './FaqItem.module.css'

type FaqItemProps = {
  question: string
  answer: string
}

export function FaqItem({ question, answer }: FaqItemProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <article className={cx(styles.item, isOpen && styles.open)}>
      <button
        className={styles.trigger}
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((v) => !v)}
      >
        <span>{question}</span>
        <span className={styles.icon} aria-hidden="true">
          {isOpen ? '−' : '+'}
        </span>
      </button>

      <div className={styles.content}>
        <p className={styles.answer}>{answer}</p>
      </div>
    </article>
  )
}
