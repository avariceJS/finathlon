import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'

import { sendPasswordResetEmail, signInWithCredentials } from '@/shared/auth'
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

type AuthMode = 'login' | 'reset'

type LoginForm = { loginOrEmail: string; password: string }
const EMPTY_LOGIN: LoginForm = { loginOrEmail: '', password: '' }
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
  const [resetEmail, setResetEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const reset = () => {
    setMode(defaultMode)
    setLoginForm(EMPTY_LOGIN)
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

  // Отдельной регистрации кабинета нет: участник регистрируется сразу на
  // профиль олимпиады, кабинет создаётся автоматически.
  const goToRegistration = () => {
    const next = redirectTo ?? searchParams.get('next')
    const target = next?.startsWith('/registration') ? next : '/registration'
    handleClose()
    navigate(target)
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
    setInfo(
      'Письмо отправлено. Перейдите по ссылке из письма и задайте новый пароль.',
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className={styles.panel}>
        <header className={styles.head}>
          <h2 className={styles.title}>
            {mode === 'login' ? 'Вход в Финатлон' : null}
            {mode === 'reset' ? 'Восстановление пароля' : null}
          </h2>
          <p className={styles.subtitle}>
            {mode === 'login'
              ? 'Войдите по логину (если выдан администратором) или по email.'
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
                aria-selected={false}
                className={styles.tab}
                onClick={goToRegistration}
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
              label="Логин или email"
              type="text"
              autoComplete="username"
              required
              value={loginForm.loginOrEmail}
              onChange={(e) =>
                setLoginForm((p) => ({ ...p, loginOrEmail: e.target.value }))
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
                onClick={goToRegistration}
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
