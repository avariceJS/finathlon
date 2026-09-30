import { supabase } from '@/shared/supabase'
import { AUTH_LOGIN_EMAIL_DOMAIN } from '@/shared/config/auth-login'

export type AuthResult = {
  error: string | null
}

export type LoginPayload = {
  loginOrEmail: string
  password: string
}

export type RegisterPayload = {
  email: string
  password: string
  firstName: string
  lastName: string
}

async function resolveLoginToEmail(
  loginOrEmail: string,
): Promise<{ email: string | null; error: string | null }> {
  const trimmed = loginOrEmail.trim()
  if (!trimmed) {
    return { email: null, error: 'Введите логин или email' }
  }
  if (trimmed.includes('@')) {
    return { email: trimmed.toLowerCase(), error: null }
  }
  const { data, error } = await supabase.rpc('resolve_auth_email', {
    p_identifier: trimmed,
  })
  if (error) return { email: null, error: humanizeAuthError(error.message) }
  const email = typeof data === 'string' && data !== '' ? data : null
  if (!email) {
    return { email: null, error: 'Пользователь с таким логином не найден' }
  }
  return { email, error: null }
}

export async function signInWithCredentials(
  payload: LoginPayload,
): Promise<AuthResult> {
  const { email, error: resolveErr } = await resolveLoginToEmail(
    payload.loginOrEmail,
  )
  if (resolveErr) return { error: resolveErr }
  if (!email) return { error: 'Введите логин или email' }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: payload.password,
  })
  if (error) return { error: humanizeAuthError(error.message) }
  return { error: null }
}

type SignUpUser = {
  identities?: { id: string }[] | null
} | null

function emailIsTaken(
  error: { message: string } | null,
  user: SignUpUser,
): boolean {
  if (error) {
    const lower = error.message.toLowerCase()
    if (
      lower.includes('already registered') ||
      lower.includes('already been registered') ||
      lower.includes('already exists')
    ) {
      return true
    }
  }
  return Boolean(
    user && Array.isArray(user.identities) && user.identities.length === 0,
  )
}

async function signUpNewUser(payload: {
  email: string
  password: string
  firstName: string
  lastName: string
}) {
  return supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        first_name: payload.firstName,
        last_name: payload.lastName,
      },
    },
  })
}

export async function registerWithProfile(
  payload: RegisterPayload,
): Promise<AuthResult> {
  const firstName = payload.firstName.trim()
  const lastName = payload.lastName.trim()
  const emailLower = payload.email.trim().toLowerCase()

  if (emailLower.endsWith(`@${AUTH_LOGIN_EMAIL_DOMAIN}`)) {
    return {
      error:
        'Этот домен зарезервирован для выдаваемых администратором учётных записей. Укажите свою почту.',
    }
  }

  const attempt = () =>
    signUpNewUser({
      email: emailLower,
      password: payload.password,
      firstName,
      lastName,
    })

  let { data, error } = await attempt()

  if (emailIsTaken(error, data.user)) {
    const { data: released, error: releaseError } = await supabase.rpc(
      'release_orphan_auth_email',
      { p_email: emailLower },
    )
    if (releaseError) {
      return {
        error:
          'Почта ещё занята удалённой учётной записью. Выполните в Supabase новую SQL-миграцию и повторите регистрацию.',
      }
    }
    if (released !== true) {
      return { error: 'Пользователь с такой почтой уже зарегистрирован' }
    }
    const retry = await attempt()
    data = retry.data
    error = retry.error
  }

  if (error) return { error: humanizeAuthError(error.message) }
  if (emailIsTaken(null, data.user)) {
    return { error: 'Пользователь с такой почтой уже зарегистрирован' }
  }
  if (!data.user) {
    return {
      error:
        'Регистрация выполнена, но требуется подтверждение почты. Проверьте email.',
    }
  }

  return { error: null }
}

export async function requestAuthEmailChange(
  email: string,
): Promise<AuthResult> {
  const next = email.trim().toLowerCase()
  if (!next.includes('@')) {
    return { error: 'Введите корректный email' }
  }
  if (next.endsWith(`@${AUTH_LOGIN_EMAIL_DOMAIN}`)) {
    return { error: 'Укажите настоящий адрес почты' }
  }

  const { error } = await supabase.auth.updateUser({ email: next })
  if (error) return { error: humanizeAuthError(error.message) }
  return { error: null }
}

export async function updatePassword(password: string): Promise<AuthResult> {
  if (password.length < 6) {
    return { error: 'Пароль должен быть не короче 6 символов' }
  }

  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData.session) {
    return {
      error:
        'Ссылка для сброса недействительна или устарела. Запросите письмо ещё раз.',
    }
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: humanizeAuthError(error.message) }
  return { error: null }
}

export async function sendPasswordResetEmail(
  email: string,
): Promise<AuthResult> {
  const redirectTo =
    typeof window !== 'undefined'
      ? `${window.location.origin}/auth/reset-password`
      : undefined

  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    redirectTo ? { redirectTo } : undefined,
  )
  if (error) return { error: humanizeAuthError(error.message) }
  return { error: null }
}

function humanizeAuthError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('invalid login credentials')) {
    return 'Неверный логин, почта или пароль'
  }
  if (
    lower.includes('already registered') ||
    lower.includes('already been registered') ||
    lower.includes('user already exists')
  ) {
    return 'Пользователь с такой почтой уже зарегистрирован'
  }
  if (
    lower.includes('different from the old') ||
    lower.includes('should be different')
  ) {
    return 'Новый пароль должен отличаться от текущего'
  }
  if (
    lower.includes('auth session missing') ||
    lower.includes('session expired') ||
    (lower.includes('invalid') && lower.includes('token'))
  ) {
    return 'Ссылка для сброса недействительна или устарела. Запросите письмо ещё раз.'
  }
  if (lower.includes('password should be at least')) {
    return 'Пароль должен быть не короче 6 символов'
  }
  if (lower.includes('email') && lower.includes('invalid')) {
    return 'Введите корректный email'
  }
  if (lower.includes('email not confirmed')) {
    return 'Email не подтверждён. Выключите Confirm email в настройках Supabase.'
  }
  if (lower.includes('rate limit') || lower.includes('too many')) {
    return 'Слишком много попыток. Подождите и попробуйте ещё раз.'
  }
  return message
}
