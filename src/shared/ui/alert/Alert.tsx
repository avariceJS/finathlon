import type { ReactNode } from 'react'

import { cx } from '@/shared/lib/classNames'

import styles from './Alert.module.css'

type AlertVariant = 'info' | 'success' | 'error' | 'warning'

type AlertProps = {
  variant?: AlertVariant
  title?: string
  children?: ReactNode
  className?: string
}

export function Alert({
  variant = 'info',
  title,
  children,
  className,
}: AlertProps) {
  return (
    <div
      className={cx(styles.alert, styles[variant], className)}
      role={variant === 'error' || variant === 'warning' ? 'alert' : 'status'}
    >
      {title ? <p className={styles.title}>{title}</p> : null}
      {children ? <div className={styles.body}>{children}</div> : null}
    </div>
  )
}
