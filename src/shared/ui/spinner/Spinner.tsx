import { cx } from '@/shared/lib/classNames'

import styles from './Spinner.module.css'

type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg'
  label?: string
  className?: string
  inline?: boolean
}

export function Spinner({
  size = 'md',
  label,
  className,
  inline = false,
}: SpinnerProps) {
  return (
    <div
      className={cx(
        styles.wrapper,
        inline && styles.inline,
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <span className={cx(styles.spinner, styles[size])} />
      {label ? <span className={styles.label}>{label}</span> : null}
    </div>
  )
}
