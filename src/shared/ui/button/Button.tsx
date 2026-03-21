import type {
    AnchorHTMLAttributes,
    ButtonHTMLAttributes,
    PropsWithChildren,
  } from 'react'
  
  import { cx } from '@/shared/lib/classNames'
  
  import styles from './Button.module.css'
  
  type BaseProps = PropsWithChildren<{
    variant?: 'primary' | 'secondary'
    size?: 'sm' | 'md'
    fullWidth?: boolean
    className?: string
  }>
  
  type ButtonAsButton = BaseProps &
    ButtonHTMLAttributes<HTMLButtonElement> & {
      href?: never
    }
  
  type ButtonAsAnchor = BaseProps &
    AnchorHTMLAttributes<HTMLAnchorElement> & {
      href: string
    }
  
  type ButtonProps = ButtonAsButton | ButtonAsAnchor
  
  export function Button({
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    className,
    children,
    ...props
  }: ButtonProps) {
    const classes = cx(
      styles.button,
      styles[variant],
      styles[size],
      fullWidth && styles.fullWidth,
      className,
    )
  
    if ('href' in props && props.href) {
      return (
        <a className={classes} {...props}>
          {children}
        </a>
      )
    }
  
    return (
      <button className={classes} type="button" {...(props as ButtonAsButton)}>
        {children}
      </button>
    )
  }