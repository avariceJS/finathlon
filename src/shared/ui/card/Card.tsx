import type { ElementType, PropsWithChildren } from 'react'

import { cx } from '@/shared/lib/classNames'

import styles from './Card.module.css'

type CardProps = PropsWithChildren<{
  as?: ElementType
  className?: string
  padded?: boolean
  hoverable?: boolean
}>

export function Card({
  as: Component = 'div',
  className,
  padded = true,
  hoverable = false,
  children,
}: CardProps) {
  return (
    <Component
      className={cx(
        styles.card,
        padded && styles.padded,
        hoverable && styles.hoverable,
        className,
      )}
    >
      {children}
    </Component>
  )
}
