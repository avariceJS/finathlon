import type { PropsWithChildren, ReactNode } from 'react'

import { cx } from '@/shared/lib/classNames'
import { Container } from '@/shared/ui/container/Container'

import styles from './Section.module.css'

type SectionProps = PropsWithChildren<{
  title?: string
  description?: string
  actions?: ReactNode
  className?: string
  contentClassName?: string
  centered?: boolean
  id?: string
  withContainer?: boolean
}>

export function Section({
  title,
  description,
  actions,
  className,
  contentClassName,
  centered = false,
  id,
  withContainer = true,
  children,
}: SectionProps) {
  const head = (
    <div className={cx(styles.head, centered && styles.headCentered)}>
      {title ? <h2 className={styles.title}>{title}</h2> : null}
      {description ? (
        <p className={styles.description}>{description}</p>
      ) : null}
      {actions ? <div>{actions}</div> : null}
    </div>
  )

  const body = (
    <>
      {title || description ? head : null}
      <div className={cx(styles.content, contentClassName)}>{children}</div>
    </>
  )

  return (
    <section id={id} className={cx(styles.section, className)}>
      {withContainer ? <Container>{body}</Container> : body}
    </section>
  )
}
