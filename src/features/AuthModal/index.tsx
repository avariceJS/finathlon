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
  password: '',
  lastName: '',
  firstName: '',
  middleName: '',
  email: '',
  phone: '',
  birthDate: '',
  country: '',
  federalDistrict: '',
  region: '',
  postalCode: '',
  localityType: '',
  locality: '',
  school: '',
  classCourse: '',
  orphan: '',
  ovz: '',
  schoolName: '',
  schoolAddress: '',
  schoolPhone: '',
  schoolEmail: '',
  teacherFullName: '',
  teacherPhone: '',
  teacherEmail: '',
  parentFullName: '',
  parentPhone: '',
  parentEmail: '',
  olympiadReason: '',
  financeInterest: '',
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
    (
      event: ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
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

    await onRegisterSubmit?.(registerForm)
  }

  const switchToRegister = () => {
    setErrorMessage('')
    setMode('register')
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className={styles.modal}>
      <section className={styles.panel}>
        {mode === 'login' ? <h2 className={styles.title}>Войти в аккаунт</h2> : null}

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
            onClose={handleClose}
          />
        )}
      </section>
    </Modal>
  )
}

export type { AuthModalProps, LoginFormState, RegisterFormState } from './types'
