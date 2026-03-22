import type { ChangeEvent, FormEvent } from 'react'

import { TextField } from '@/shared/ui/text-field/TextField'

import type { LoginFormState } from '../types'
import styles from '../styles/AuthModal.module.css'

type AuthLoginFormProps = {
  loginForm: LoginFormState
  errorMessage: string
  onFieldChange: (
    field: keyof LoginFormState,
  ) => (event: ChangeEvent<HTMLInputElement>) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>
  onGosuslugiClick?: () => void
  onVkClick?: () => void
  onSwitchToRegister: () => void
}

export function AuthLoginForm({
  loginForm,
  errorMessage,
  onFieldChange,
  onSubmit,
  onGosuslugiClick,
  onVkClick,
  onSwitchToRegister,
}: AuthLoginFormProps) {
  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <TextField
        name="login"
        placeholder="Логин"
        value={loginForm.login}
        onChange={onFieldChange('login')}
        autoComplete="username"
        required
      />

      <TextField
        name="password"
        type="password"
        placeholder="Пароль"
        value={loginForm.password}
        onChange={onFieldChange('password')}
        autoComplete="current-password"
        required
      />

      {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}

      <button className={styles.actionButton} type="submit">
        Войти
      </button>

      <p className={styles.separator}>или</p>

      <button
        className={styles.actionButton}
        type="button"
        onClick={onGosuslugiClick}
      >
        Госуслуги
      </button>

      <button className={styles.actionButton} type="button" onClick={onVkClick}>
        VK
      </button>

      <p className={styles.switchRow}>
        <span className={styles.switchLabel}>Нет аккаунта?</span>{' '}
        <button
          className={styles.switchButton}
          type="button"
          onClick={onSwitchToRegister}
        >
          Зарегистрироваться
        </button>
      </p>
    </form>
  )
}
