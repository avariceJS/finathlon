import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router'

import { Modal } from '@/shared/ui/modal/Modal'

import type {
  AuthModalProps,
  LoginFormState,
} from './types' 
import styles from './styles/AuthModal.module.css'
import { AuthLoginForm } from './ui/AuthLoginForm'

const INITIAL_LOGIN_FORM: LoginFormState = {
  login: '',
  password: '',
}

export function AuthModal({
  isOpen,
  onClose,
  onLoginSubmit,
  onGosuslugiClick,
  onVkClick,
}: AuthModalProps) {
  const navigate = useNavigate() 

  const [loginForm, setLoginForm] = useState<LoginFormState>(INITIAL_LOGIN_FORM)
  const [errorMessage, setErrorMessage] = useState('')

  const resetState = () => {
    setLoginForm(INITIAL_LOGIN_FORM)
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

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')

    await onLoginSubmit?.(loginForm)
  }

  const switchToRegister = () => {
    handleClose() 
    navigate('/register') 
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className={styles.modal}>
      <section className={styles.panel}>
        <h2 className={styles.title}>Войти в аккаунт</h2>

        <AuthLoginForm
          loginForm={loginForm}
          errorMessage={errorMessage}
          onFieldChange={updateLoginField}
          onSubmit={handleLoginSubmit}
          onGosuslugiClick={onGosuslugiClick}
          onVkClick={onVkClick}
          onSwitchToRegister={switchToRegister}
        />
      </section>
    </Modal>
  )
}

export type { AuthModalProps, LoginFormState } from './types'