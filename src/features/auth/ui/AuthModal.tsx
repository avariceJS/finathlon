import { useState, type ChangeEvent } from 'react'

import { Modal } from '@/shared/ui/modal/Modal'
import { TextField } from '@/shared/ui/text-field/TextField'

import styles from './AuthModal.module.css'

type AuthMode = 'login' | 'register'

type LoginFormState = {
  login: string
  password: string
}

type RegisterFormState = {
  login: string
  email: string
  password: string
  passwordConfirm: string
}

type AuthModalProps = {
  isOpen: boolean
  onClose: () => void
  onLoginSubmit?: (values: LoginFormState) => void | Promise<void>
  onRegisterSubmit?: (values: RegisterFormState) => void | Promise<void>
  onGosuslugiClick?: () => void
  onVkClick?: () => void
}

const INITIAL_LOGIN_FORM: LoginFormState = {
  login: '',
  password: '',
}

const INITIAL_REGISTER_FORM: RegisterFormState = {
  login: '',
  email: '',
  password: '',
  passwordConfirm: '',
}

export function AuthModal({
  isOpen,
  onClose,
  onLoginSubmit,
  onRegisterSubmit,
  onGosuslugiClick,
  onVkClick,
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [loginForm, setLoginForm] = useState<LoginFormState>(INITIAL_LOGIN_FORM)
  const [registerForm, setRegisterForm] =
    useState<RegisterFormState>(INITIAL_REGISTER_FORM)
  const [errorMessage, setErrorMessage] = useState('')

  const resetState = () => {
    setMode('login')
    setLoginForm(INITIAL_LOGIN_FORM)
    setRegisterForm(INITIAL_REGISTER_FORM)
    setErrorMessage('')
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const updateLoginField =
    (field: keyof LoginFormState) => (event: ChangeEvent<HTMLInputElement>) => {
      setErrorMessage('')
      setLoginForm((prev) => ({
        ...prev,
        [field]: event.target.value,
      }))
    }

  const updateRegisterField =
    (field: keyof RegisterFormState) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setErrorMessage('')
      setRegisterForm((prev) => ({
        ...prev,
        [field]: event.target.value,
      }))
    }

  const handleLoginSubmit = async (
    event: React.SyntheticEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    setErrorMessage('')

    await onLoginSubmit?.(loginForm)
  }

  const handleRegisterSubmit = async (
    event: React.SyntheticEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    setErrorMessage('')

    if (registerForm.password !== registerForm.passwordConfirm) {
      setErrorMessage('Пароли не совпадают')
      return
    }

    await onRegisterSubmit?.(registerForm)
  }

  const switchToRegister = () => {
    setErrorMessage('')
    setMode('register')
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className={styles.modal}>
      <section className={styles.panel}>
        <h2 className={styles.title}>
          {mode === 'login' ? 'Войти в аккаунт' : 'Регистрация'}
        </h2>

        {mode === 'login' ? (
          <form className={styles.form} onSubmit={handleLoginSubmit}>
            <TextField
              name="login"
              placeholder="Логин"
              value={loginForm.login}
              onChange={updateLoginField('login')}
              autoComplete="username"
              required
            />

            <TextField
              name="password"
              type="password"
              placeholder="Пароль"
              value={loginForm.password}
              onChange={updateLoginField('password')}
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

            <button
              className={styles.actionButton}
              type="button"
              onClick={onVkClick}
            >
              VK
            </button>

            <p className={styles.switchRow}>
              <span className={styles.switchLabel}>Нет аккаунта?</span>{' '}
              <button
                className={styles.switchButton}
                type="button"
                onClick={switchToRegister}
              >
                Зарегистрироваться
              </button>
            </p>
          </form>
        ) : (
          <form className={styles.form} onSubmit={handleRegisterSubmit}>
            <TextField
              name="login"
              placeholder="Логин"
              value={registerForm.login}
              onChange={updateRegisterField('login')}
              autoComplete="username"
              required
            />

            <TextField
              name="email"
              type="email"
              placeholder="Почта"
              value={registerForm.email}
              onChange={updateRegisterField('email')}
              autoComplete="email"
              required
            />

            <TextField
              name="password"
              type="password"
              placeholder="Пароль"
              value={registerForm.password}
              onChange={updateRegisterField('password')}
              autoComplete="new-password"
              required
            />

            <TextField
              name="passwordConfirm"
              type="password"
              placeholder="Повторите пароль"
              value={registerForm.passwordConfirm}
              onChange={updateRegisterField('passwordConfirm')}
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
        )}
      </section>
    </Modal>
  )
}