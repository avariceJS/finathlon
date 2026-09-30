import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { supabase } from '@/shared/supabase'

import { hasPasswordRecovery, markPasswordRecovery } from './recovery'

const RESET_PATH = '/auth/reset-password'

export function PasswordRecoveryRedirect() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (hasPasswordRecovery() && location.pathname !== RESET_PATH) {
      navigate(RESET_PATH, { replace: true })
    }
  }, [location.pathname, navigate])

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== 'PASSWORD_RECOVERY') return
      markPasswordRecovery()
      window.setTimeout(() => {
        if (window.location.pathname !== RESET_PATH) {
          navigate(RESET_PATH, { replace: true })
        }
      }, 0)
    })
    return () => data.subscription.unsubscribe()
  }, [navigate])

  return null
}
