import type { ChangeEvent, FormEvent } from 'react'

import { TextField } from '@/shared/ui/text-field/TextField'

import type { RegisterFormState } from '../types'
import styles from '../styles/AuthModal.module.css'

type AuthRegisterFormProps = {
  registerForm: RegisterFormState
  errorMessage: string
  onFieldChange: (
    field: keyof RegisterFormState,
  ) => (event: ChangeEvent<HTMLInputElement>) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>
}

export function AuthRegisterForm({
  registerForm,
  errorMessage,
  onFieldChange,
  onSubmit,
}: AuthRegisterFormProps) {
  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <TextField
        name="login"
        placeholder="Логин"
        value={registerForm.login}
        onChange={onFieldChange('login')}
        autoComplete="username"
        required
      />

      <TextField
        name="email"
        type="email"
        placeholder="Почта"
        value={registerForm.email}
        onChange={onFieldChange('email')}
        autoComplete="email"
        required
      />

      <TextField
        name="password"
        type="password"
        placeholder="Пароль"
        value={registerForm.password}
        onChange={onFieldChange('password')}
        autoComplete="new-password"
        required
      />

      <TextField
        name="passwordConfirm"
        type="password"
        placeholder="Повторите пароль"
        value={registerForm.passwordConfirm}
        onChange={onFieldChange('passwordConfirm')}
        autoComplete="new-password"
        required
      />

      {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}

      <div className={styles.registerSubmitRow}>
        <button className={styles.actionButton} type="submit">
          Зарегистрироваться
        </button>
      </div>
    </form>
  )
}
