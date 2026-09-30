export const PASSWORD_RECOVERY_FLAG = 'finathlon:password-recovery'

export function markPasswordRecovery() {
  try {
    sessionStorage.setItem(PASSWORD_RECOVERY_FLAG, '1')
  } catch {
    /* private mode */
  }
}

export function hasPasswordRecovery() {
  try {
    return sessionStorage.getItem(PASSWORD_RECOVERY_FLAG) === '1'
  } catch {
    return false
  }
}

export function clearPasswordRecovery() {
  try {
    sessionStorage.removeItem(PASSWORD_RECOVERY_FLAG)
  } catch {
    /* private mode */
  }
}

export function captureRecoveryFromUrl() {
  if (typeof window === 'undefined') return
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const search = new URLSearchParams(window.location.search)
  if (hash.get('type') === 'recovery' || search.get('type') === 'recovery') {
    markPasswordRecovery()
  }
}
