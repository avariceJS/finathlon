import { Navigate, Route, Routes } from 'react-router'

import { AccountPage } from '@/pages/account'
import { HomePage } from '@/pages/home'
import { RegisterPage } from '@/pages/register/RegisterPage'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/account" element={<Navigate to="/account/personal" replace />} />
      <Route path="/account/:section" element={<AccountPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Routes>
  )
}