import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'

import {
  clearPasswordRecovery,
  hasPasswordRecovery,
  markPasswordRecovery,
  updatePassword,
  useAuth,
} from '@/shared/auth'
import { supabase } from '@/shared/supabase'
import { Alert } from '@/shared/ui/alert/Alert'
import { Button } from '@/shared/ui/button/Button'
import { Spinner } from '@/shared/ui/spinner/Spinner'
import { TextField } from '@/shared/ui/text-field/TextField'

import styles from './ResetPasswordPage.module.css'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { user, isAuthLoading, signOut } = useAuth()
  const [recovery, setRecovery] = useState(hasPasswordRecovery)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (hasPasswordRecovery()) setRecovery(true)
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== 'PASSWORD_RECOVERY') return
      markPasswordRecovery()
      setRecovery(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const linkMissing = !isAuthLoading && (!recovery || !user) && !done

  useEffect(() => {
    if (linkMissing && recovery) clearPasswordRecovery()
  }, [linkMissing, recovery])

  useEffect(() => {
    if (!done) return
    const id = window.setTimeout(() => {
      navigate('/account/personal', { replace: true })
    }, 900)
    return () => window.clearTimeout(id)
  }, [done, navigate])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    if (password !== passwordConfirm) {
      setError('Пароли не совпадают')
      return
    }
    setIsSubmitting(true)
    const result = await updatePassword(password)
    setIsSubmitting(false)
    if (result.error) {
      setError(result.error)
      return
    }
    clearPasswordRecovery()
    setDone(true)
  }

  const handleCancel = async () => {
    clearPasswordRecovery()
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Новый пароль</h1>
        <p className={styles.subtitle}>
          {done
            ? 'Пароль обновлён. Открываем личный кабинет.'
            : linkMissing
              ? 'Откройте ссылку из письма, чтобы задать новый пароль.'
              : 'Задайте новый пароль для входа в Финатлон. Старый после этого перестанет работать.'}
        </p>

        {isAuthLoading && !done ? (
          <Spinner label="Проверяем ссылку..." />
        ) : null}

        {!isAuthLoading && done ? (
          <Alert variant="success">Пароль успешно изменён.</Alert>
        ) : null}

        {linkMissing ? (
          <>
            <Alert variant="error">
              Ссылка для сброса недействительна или устарела. Запросите письмо
              ещё раз на странице входа.
            </Alert>
            <div className={styles.actions}>
              <Button to="/auth" fullWidth>
                К странице входа
              </Button>
            </div>
          </>
        ) : null}

        {!isAuthLoading && recovery && user && !done ? (
          <form className={styles.form} onSubmit={handleSubmit}>
            {error ? <Alert variant="error">{error}</Alert> : null}
            <TextField
              label="Новый пароль"
              type="password"
              autoComplete="new-password"
              required
              hint="Минимум 6 символов"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <TextField
              label="Повторите пароль"
              type="password"
              autoComplete="new-password"
              required
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
            />
            <div className={styles.actions}>
              <Button type="submit" loading={isSubmitting} fullWidth>
                Сохранить пароль
              </Button>
              <Button
                type="button"
                variant="ghost"
                fullWidth
                onClick={() => {
                  void handleCancel()
                }}
              >
                Выйти без смены пароля
              </Button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  )
}
