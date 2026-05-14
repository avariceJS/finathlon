import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'

import { AuthModal } from '@/features/AuthModal'
import { useAuth } from '@/shared/auth'
import { Spinner } from '@/shared/ui/spinner/Spinner'

export function AuthPage() {
  const { user, isAuthLoading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [open, setOpen] = useState(true)

  const next = searchParams.get('next') ?? '/account/personal'

  useEffect(() => {
    if (!isAuthLoading && user) {
      navigate(next, { replace: true })
    }
  }, [isAuthLoading, user, navigate, next])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'var(--color-bg-page, #f6f7fb)',
      }}
    >
      {isAuthLoading ? (
        <Spinner size="lg" label="Проверяем сессию..." />
      ) : (
        <AuthModal
          isOpen={open}
          onClose={() => {
            setOpen(false)
            navigate('/')
          }}
          redirectTo={next}
        />
      )}
    </div>
  )
}
