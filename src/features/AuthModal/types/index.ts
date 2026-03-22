export type AuthMode = 'login' | 'register'

export type LoginFormState = {
  login: string
  password: string
}

export type RegisterFormState = {
  login: string
  email: string
  password: string
  passwordConfirm: string
}

export type AuthModalProps = {
  isOpen: boolean
  onClose: () => void
  onLoginSubmit?: (values: LoginFormState) => void | Promise<void>
  onRegisterSubmit?: (values: RegisterFormState) => void | Promise<void>
  onGosuslugiClick?: () => void
  onVkClick?: () => void
}
