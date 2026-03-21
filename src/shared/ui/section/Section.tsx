import type { PropsWithChildren } from 'react'

import { cx } from '@/shared/lib/classNames'
import { Container } from '@/shared/ui/container/Container'

import styles from './Section.module.css'

type SectionProps = PropsWithChildren<{
  title: string
  className?: string
  contentClassName?: string
  centered?: boolean
  id?: string
}>

export function Section({
  title,
  className,
  contentClassName,
  centered = false,
  id,
  children,
}: SectionProps) {
  return (
    <section id={id} className={cx(styles.section, className)}>
      <Container>
        <div className={cx(styles.head, centered && styles.headCentered)}>
          <h2 className={styles.title}>{title}</h2>
        </div>

        <div className={cx(styles.content, contentClassName)}>{children}</div>
      </Container>
    </section>
  )
}