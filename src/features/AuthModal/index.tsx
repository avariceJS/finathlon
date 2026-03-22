import { useState, type ChangeEvent, type FormEvent } from 'react'

import { Modal } from '@/shared/ui/modal/Modal'

import type {
  AuthModalProps,
  LoginFormState,
  RegisterFormState,
} from './types'
import styles from './styles/AuthModal.module.css'
import { AuthLoginForm } from './ui/AuthLoginForm'
import { AuthRegisterForm } from './ui/AuthRegisterForm'

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
  const [mode, setMode] = useState<'login' | 'register'>('login')
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

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')

    await onLoginSubmit?.(loginForm)
  }

  const handleRegisterSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
          <AuthLoginForm
            loginForm={loginForm}
            errorMessage={errorMessage}
            onFieldChange={updateLoginField}
            onSubmit={handleLoginSubmit}
            onGosuslugiClick={onGosuslugiClick}
            onVkClick={onVkClick}
            onSwitchToRegister={switchToRegister}
          />
        ) : (
          <AuthRegisterForm
            registerForm={registerForm}
            errorMessage={errorMessage}
            onFieldChange={updateRegisterField}
            onSubmit={handleRegisterSubmit}
          />
        )}
      </section>
    </Modal>
  )
}

export type { AuthModalProps, LoginFormState, RegisterFormState } from './types'
