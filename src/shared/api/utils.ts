import type { PostgrestError } from '@supabase/supabase-js'

export type ApiResult<T> =
  | { data: T; error: null }
  | { data: null; error: string }

export function toError(error: PostgrestError | Error | unknown): string {
  if (!error) return 'Неизвестная ошибка'
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const value = (error as { message?: unknown }).message
    if (typeof value === 'string') return value
  }
  return 'Неизвестная ошибка'
}

export function ok<T>(data: T): ApiResult<T> {
  return { data, error: null }
}

export function fail<T = never>(error: unknown): ApiResult<T> {
  return { data: null, error: toError(error) }
}
