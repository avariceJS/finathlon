import { PasswordRecoveryRedirect } from '@/shared/auth'

import { AppRouter } from './router/AppRouter'

export default function App() {
  return (
    <>
      <PasswordRecoveryRedirect />
      <AppRouter />
    </>
  )
}
