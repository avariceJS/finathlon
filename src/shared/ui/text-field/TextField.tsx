import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'

import { cx } from '@/shared/lib/classNames'

import styles from './TextField.module.css'

type CommonProps = {
  label?: string
  hint?: string
  error?: string | null
  containerClassName?: string
}

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> &
  CommonProps & {
    multiline?: false
  }

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> &
  CommonProps & {
    multiline: true
  }

export type TextFieldProps = InputProps | TextareaProps

function isTextarea(props: TextFieldProps): props is TextareaProps {
  return 'multiline' in props && props.multiline === true
}

export const TextField = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  TextFieldProps
>(function TextField(props, ref) {
  const reactId = useId()
  const inputId = props.id ?? reactId
  const baseInputClass = cx(styles.input, props.error && styles.invalid)
  const containerClass = cx(styles.field, props.containerClassName)

  if (isTextarea(props)) {
    const {
      label,
      hint,
      error,
      containerClassName: _ignoredContainer,
      multiline: _ignoredMultiline,
      className,
      id: _ignoredId,
      ...rest
    } = props
    void _ignoredContainer
    void _ignoredMultiline
    void _ignoredId
    return (
      <div className={containerClass}>
        {label ? (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        ) : null}
        <textarea
          id={inputId}
          ref={ref as React.Ref<HTMLTextAreaElement>}
          className={cx(baseInputClass, styles.textarea, className)}
          {...rest}
        />
        {error ? <p className={styles.error}>{error}</p> : null}
        {!error && hint ? <p className={styles.hint}>{hint}</p> : null}
      </div>
    )
  }

  const {
    label,
    hint,
    error,
    containerClassName: _ignoredContainerInput,
    className,
    id: _ignoredIdInput,
    ...rest
  } = props
  void _ignoredContainerInput
  void _ignoredIdInput

  return (
    <div className={containerClass}>
      {label ? (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        ref={ref as React.Ref<HTMLInputElement>}
        className={cx(baseInputClass, className)}
        {...rest}
      />
      {error ? <p className={styles.error}>{error}</p> : null}
      {!error && hint ? <p className={styles.hint}>{hint}</p> : null}
    </div>
  )
})
