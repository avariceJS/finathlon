import type { ReactNode } from 'react'

import { cx } from '@/shared/lib/classNames'
import { Container } from '@/shared/ui/container/Container'

import styles from './PageHeader.module.css'

type PageHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <section className={cx(styles.section, className)}>
      <Container className={styles.inner}>
        <div className={styles.text}>
          {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
          <h1 className={styles.title}>{title}</h1>
          {description ? (
            <p className={styles.description}>{description}</p>
          ) : null}
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </Container>
    </section>
  )
}
