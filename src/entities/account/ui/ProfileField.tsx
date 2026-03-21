import type { ChangeEvent } from 'react'

import type { AccountFieldType } from '@/pages/account/model/types'

import styles from './ProfileField.module.css'

type ProfileFieldProps = {
  label: string
  value: string
  type?: AccountFieldType
  editable?: boolean
  onChange?: (value: string) => void
}

export function ProfileField({
  label,
  value,
  type = 'text',
  editable = false,
  onChange,
}: ProfileFieldProps) {
  const displayValue = type === 'password' && !editable ? '••••••••' : value

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(event.target.value)
  }

  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>

      {editable ? (
        <input
          className={styles.input}
          type={type}
          value={value}
          onChange={handleChange}
        />
      ) : (
        <div className={styles.value}>{displayValue}</div>
      )}
    </div>
  )
}