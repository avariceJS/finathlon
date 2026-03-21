import { forwardRef, type InputHTMLAttributes } from 'react'

import { cx } from '@/shared/lib/classNames'

import styles from './TextField.module.css'

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ className, ...props }, ref) => {
    return <input ref={ref} className={cx(styles.input, className)} {...props} />
  },
)

TextField.displayName = 'TextField'