import { forwardRef, useId, type SelectHTMLAttributes } from 'react'

import { cx } from '@/shared/lib/classNames'

import styles from './Select.module.css'

type SelectOption = {
  value: string
  label: string
}

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> & {
  label?: string
  hint?: string
  error?: string | null
  options: SelectOption[]
  placeholder?: string
  containerClassName?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    {
      label,
      hint,
      error,
      options,
      placeholder,
      containerClassName,
      className,
      id,
      ...rest
    },
    ref,
  ) {
    const reactId = useId()
    const inputId = id ?? reactId
    return (
      <div className={cx(styles.field, containerClassName)}>
        {label ? (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        ) : null}
        <div className={styles.wrapper}>
          <select
            id={inputId}
            ref={ref}
            className={cx(styles.select, error && styles.invalid, className)}
            {...rest}
          >
            {placeholder ? (
              <option value="" disabled hidden>
                {placeholder}
              </option>
            ) : null}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {error ? <p className={styles.error}>{error}</p> : null}
        {!error && hint ? <p className={styles.hint}>{hint}</p> : null}
      </div>
    )
  },
)
