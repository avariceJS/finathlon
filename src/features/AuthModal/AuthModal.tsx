import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'

import {
  registerWithProfile,
  sendPasswordResetEmail,
  signInWithCredentials,
} from '@/shared/auth'
import { cx } from '@/shared/lib/classNames'
import { Alert } from '@/shared/ui/alert/Alert'
import { Button } from '@/shared/ui/button/Button'
import { Modal } from '@/shared/ui/modal/Modal'
import { TextField } from '@/shared/ui/text-field/TextField'

import styles from './AuthModal.module.css'

type AuthModalProps = {
  isOpen: boolean
  onClose: () => void
  defaultMode?: AuthMode
  redirectTo?: string
}

type AuthMode = 'login' | 'register' | 'reset'

type LoginForm = { email: string; password: string }
type RegisterForm = {
  email: string
  password: string
  passwordConfirm: string
  firstName: string
  lastName: string
}

const EMPTY_LOGIN: LoginForm = { email: '', password: '' }
const EMPTY_REGISTER: RegisterForm = {
  email: '',
  password: '',
  passwordConfirm: '',
  firstName: '',
  lastName: '',
}

export function AuthModal({
  isOpen,
  onClose,
  defaultMode = 'login',
  redirectTo,
}: AuthModalProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState<AuthMode>(defaultMode)
  const [loginForm, setLoginForm] = useState<LoginForm>(EMPTY_LOGIN)
  const [registerForm, setRegisterForm] =
    useState<RegisterForm>(EMPTY_REGISTER)
  const [resetEmail, setResetEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const reset = () => {
    setMode(defaultMode)
    setLoginForm(EMPTY_LOGIN)
    setRegisterForm(EMPTY_REGISTER)
    setResetEmail('')
    setError(null)
    setInfo(null)
    setIsSubmitting(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const finishSuccess = () => {
    const next = searchParams.get('next')
    const target = redirectTo ?? next ?? '/account/personal'
    handleClose()
    navigate(target)
  }

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setInfo(null)
    setIsSubmitting(true)
    const result = await signInWithCredentials(loginForm)
    setIsSubmitting(false)
    if (result.error) {
      setError(result.error)
      return
    }
    finishSuccess()
  }

  const handleRegisterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setInfo(null)

    if (registerForm.password !== registerForm.passwordConfirm) {
      setError('Пароли не совпадают')
      return
    }
    if (registerForm.password.length < 6) {
      setError('Пароль должен быть не короче 6 символов')
      return
    }

    setIsSubmitting(true)
    const result = await registerWithProfile({
      email: registerForm.email,
      password: registerForm.password,
      firstName: registerForm.firstName,
      lastName: registerForm.lastName,
    })
    setIsSubmitting(false)

    if (result.error) {
      setError(result.error)
      return
    }
    finishSuccess()
  }

  const handleResetSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setInfo(null)
    setIsSubmitting(true)
    const result = await sendPasswordResetEmail(resetEmail)
    setIsSubmitting(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setInfo('Письмо отправлено. Проверьте почту, чтобы сбросить пароль.')
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className={styles.panel}>
        <header className={styles.head}>
          <h2 className={styles.title}>
            {mode === 'login' ? 'Вход в Финатлон' : null}
            {mode === 'register' ? 'Регистрация' : null}
            {mode === 'reset' ? 'Восстановление пароля' : null}
          </h2>
          <p className={styles.subtitle}>
            {mode === 'login'
              ? 'Войдите, чтобы попасть в личный кабинет и продолжить участие.'
              : null}
            {mode === 'register'
              ? 'Достаточно пары полей — остальное заполним в личном кабинете.'
              : null}
            {mode === 'reset'
              ? 'Введите email — отправим ссылку для сброса пароля.'
              : null}
          </p>

          {mode !== 'reset' ? (
            <div className={styles.tabs} role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'login'}
                className={cx(styles.tab, mode === 'login' && styles.tabActive)}
                onClick={() => {
                  setMode('login')
                  setError(null)
                  setInfo(null)
                }}
              >
                Вход
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'register'}
                className={cx(
                  styles.tab,
                  mode === 'register' && styles.tabActive,
                )}
                onClick={() => {
                  setMode('register')
                  setError(null)
                  setInfo(null)
                }}
              >
                Регистрация
              </button>
            </div>
          ) : null}
        </header>

        {error ? <Alert variant="error">{error}</Alert> : null}
        {info ? <Alert variant="success">{info}</Alert> : null}

        {mode === 'login' ? (
          <form className={styles.form} onSubmit={handleLoginSubmit}>
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={loginForm.email}
              onChange={(e) =>
                setLoginForm((p) => ({ ...p, email: e.target.value }))
              }
            />
            <TextField
              label="Пароль"
              type="password"
              autoComplete="current-password"
              required
              value={loginForm.password}
              onChange={(e) =>
                setLoginForm((p) => ({ ...p, password: e.target.value }))
              }
            />

            <div className={styles.helperRow}>
              <span>Нет аккаунта?</span>
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => {
                  setMode('register')
                  setError(null)
                  setInfo(null)
                }}
              >
                Зарегистрироваться
              </button>
            </div>

            <div className={styles.actions}>
              <Button type="submit" loading={isSubmitting} fullWidth>
                Войти
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setMode('reset')
                  setError(null)
                  setInfo(null)
                }}
                fullWidth
              >
                Забыли пароль?
              </Button>
            </div>
          </form>
        ) : null}

        {mode === 'register' ? (
          <form className={styles.form} onSubmit={handleRegisterSubmit}>
            <div className={styles.row}>
              <TextField
                label="Имя"
                autoComplete="given-name"
                required
                value={registerForm.firstName}
                onChange={(e) =>
                  setRegisterForm((p) => ({ ...p, firstName: e.target.value }))
                }
              />
              <TextField
                label="Фамилия"
                autoComplete="family-name"
                required
                value={registerForm.lastName}
                onChange={(e) =>
                  setRegisterForm((p) => ({ ...p, lastName: e.target.value }))
                }
              />
            </div>
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={registerForm.email}
              onChange={(e) =>
                setRegisterForm((p) => ({ ...p, email: e.target.value }))
              }
            />
            <TextField
              label="Пароль"
              type="password"
              autoComplete="new-password"
              required
              hint="Минимум 6 символов"
              value={registerForm.password}
              onChange={(e) =>
                setRegisterForm((p) => ({ ...p, password: e.target.value }))
              }
            />
            <TextField
              label="Повторите пароль"
              type="password"
              autoComplete="new-password"
              required
              value={registerForm.passwordConfirm}
              onChange={(e) =>
                setRegisterForm((p) => ({
                  ...p,
                  passwordConfirm: e.target.value,
                }))
              }
            />

            <p className={styles.terms}>
              Создавая аккаунт, вы соглашаетесь с условиями использования
              сервиса и политикой обработки персональных данных.
            </p>

            <div className={styles.actions}>
              <Button type="submit" loading={isSubmitting} fullWidth>
                Создать аккаунт
              </Button>
            </div>
          </form>
        ) : null}

        {mode === 'reset' ? (
          <form className={styles.form} onSubmit={handleResetSubmit}>
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
            />
            <div className={styles.actions}>
              <Button type="submit" loading={isSubmitting} fullWidth>
                Отправить ссылку
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setMode('login')
                  setError(null)
                  setInfo(null)
                }}
                fullWidth
              >
                Вернуться к входу
              </Button>
            </div>
          </form>
        ) : null}
      </div>
    </Modal>
  )
}
