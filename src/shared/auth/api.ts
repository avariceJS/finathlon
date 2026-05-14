import { supabase } from '@/shared/supabase'

export type AuthResult = {
  error: string | null
}

export type LoginPayload = {
  email: string
  password: string
}

export type RegisterPayload = {
  email: string
  password: string
  firstName: string
  lastName: string
}

export async function signInWithCredentials(
  payload: LoginPayload,
): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({
    email: payload.email.trim().toLowerCase(),
    password: payload.password,
  })
  if (error) return { error: humanizeAuthError(error.message) }
  return { error: null }
}

export async function registerWithProfile(
  payload: RegisterPayload,
): Promise<AuthResult> {
  const firstName = payload.firstName.trim()
  const lastName = payload.lastName.trim()

  const { data, error } = await supabase.auth.signUp({
    email: payload.email.trim().toLowerCase(),
    password: payload.password,
    options: {
      data: { first_name: firstName, last_name: lastName },
    },
  })

  if (error) return { error: humanizeAuthError(error.message) }
  if (!data.user) {
    return {
      error:
        'Регистрация выполнена, но требуется подтверждение почты. Проверьте email.',
    }
  }

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
    return 'Неверная почта или пароль'
  }
  if (lower.includes('user already registered')) {
    return 'Пользователь с такой почтой уже зарегистрирован'
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
