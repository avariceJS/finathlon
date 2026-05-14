import type { ReactNode } from 'react'

import { cx } from '@/shared/lib/classNames'

import styles from './EmptyState.module.css'

type EmptyStateProps = {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
  variant?: 'soft' | 'plain'
}

export function EmptyState({
  title,
  description,
  actions,
  className,
  variant = 'soft',
}: EmptyStateProps) {
  return (
    <div className={cx(styles.wrapper, styles[variant], className)}>
      <h3 className={styles.title}>{title}</h3>
      {description ? (
        <p className={styles.description}>{description}</p>
      ) : null}
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  )
}
