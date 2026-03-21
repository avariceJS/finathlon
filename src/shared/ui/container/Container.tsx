import type { ElementType, PropsWithChildren } from 'react'

import { cx } from '@/shared/lib/classNames'

import styles from './Container.module.css'

type ContainerProps = PropsWithChildren<{
  as?: ElementType
  className?: string
}>

export function Container({
  as: Component = 'div',
  className,
  children,
}: ContainerProps) {
  return <Component className={cx(styles.container, className)}>{children}</Component>
}