export const AUTH_LOGIN_EMAIL_DOMAIN = 'login.finathlon'

export function isSyntheticAuthEmail(value: string | null | undefined): boolean {
  if (!value) return false
  return value.toLowerCase().endsWith(`@${AUTH_LOGIN_EMAIL_DOMAIN}`)
}

export function normalizeUsername(raw: string): string | null {
  const s = raw.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
  if (s.length < 3 || s.length > 32) return null
  return s
}

export function buildSyntheticEmail(normalizedUsername: string): string {
  return `${normalizedUsername}@${AUTH_LOGIN_EMAIL_DOMAIN}`
}
