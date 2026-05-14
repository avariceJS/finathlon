import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'

import { useAuth } from '@/shared/auth'
import { Spinner } from '@/shared/ui/spinner/Spinner'

function FullScreenLoader() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <Spinner size="lg" label="Загрузка..." />
    </div>
  )
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isAuthLoading } = useAuth()
  const location = useLocation()

  if (isAuthLoading) return <FullScreenLoader />
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/auth?next=${next}`} replace />
  }
  return <>{children}</>
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, profile, isAuthLoading, isProfileLoading } = useAuth()

  if (isAuthLoading || isProfileLoading) return <FullScreenLoader />
  if (!user) return <Navigate to="/auth" replace />
  if (profile?.role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}
