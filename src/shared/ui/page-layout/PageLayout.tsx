import type { ReactNode } from 'react'

import { cx } from '@/shared/lib/classNames'
import { Container } from '@/shared/ui/container/Container'

import styles from './PageLayout.module.css'

type PageLayoutProps = {
  header?: ReactNode
  footer?: ReactNode
  children: ReactNode
  variant?: 'page' | 'narrow'
  className?: string
  contentClassName?: string
  withContainer?: boolean
}

export function PageLayout({
  header,
  footer,
  children,
  variant = 'page',
  className,
  contentClassName,
  withContainer = false,
}: PageLayoutProps) {
  return (
    <div className={cx(styles.page, className)}>
      {header}
      <main className={cx(styles.main, styles[variant], contentClassName)}>
        {withContainer ? <Container>{children}</Container> : children}
      </main>
      {footer}
    </div>
  )
}
