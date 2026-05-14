import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  PropsWithChildren,
} from 'react'
import { Link } from 'react-router'

import { cx } from '@/shared/lib/classNames'

import styles from './Button.module.css'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

type BaseProps = PropsWithChildren<{
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  className?: string
  loading?: boolean
}>

type ButtonAsButton = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
    href?: never
    to?: never
  }

type ButtonAsAnchor = BaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'href'> & {
    href: string
    to?: never
  }

type ButtonAsLink = BaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'href'> & {
    href?: never
    to: string
  }

type ButtonProps = ButtonAsButton | ButtonAsAnchor | ButtonAsLink

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = cx(
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    loading && styles.loading,
    className,
  )

  if ('to' in rest && rest.to) {
    const { to, ...anchorProps } = rest
    return (
      <Link
        to={to}
        className={classes}
        {...(anchorProps as AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        <span className={styles.content}>{children}</span>
      </Link>
    )
  }

  if ('href' in rest && rest.href) {
    const { href, ...anchorProps } = rest
    return (
      <a
        href={href}
        className={classes}
        {...(anchorProps as AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        <span className={styles.content}>{children}</span>
      </a>
    )
  }

  const buttonProps = rest as ButtonHTMLAttributes<HTMLButtonElement>
  return (
    <button
      type={buttonProps.type ?? 'button'}
      disabled={buttonProps.disabled || loading}
      className={classes}
      {...buttonProps}
    >
      <span className={styles.content}>{children}</span>
    </button>
  )
}
