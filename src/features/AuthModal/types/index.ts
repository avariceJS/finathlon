export type AuthMode = 'login' | 'register'

export type LoginFormState = {
  login: string
  password: string
}

export type RegisterFormState = {
  login: string
  password: string
  lastName: string
  firstName: string
  middleName: string
  email: string
  phone: string
  birthDate: string
  country: string
  federalDistrict: string
  region: string
  postalCode: string
  localityType: string
  locality: string
  school: string
  classCourse: string
  orphan: string
  ovz: string
  schoolName: string
  schoolAddress: string
  schoolPhone: string
  schoolEmail: string
  teacherFullName: string
  teacherPhone: string
  teacherEmail: string
  parentFullName: string
  parentPhone: string
  parentEmail: string
  olympiadReason: string
  financeInterest: string
}

export type AuthModalProps = {
  isOpen: boolean
  onClose: () => void
  onLoginSubmit?: (values: LoginFormState) => void | Promise<void>
  onRegisterSubmit?: (values: RegisterFormState) => void | Promise<void>
  onGosuslugiClick?: () => void
  onVkClick?: () => void
}
