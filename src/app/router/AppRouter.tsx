import { Navigate, Route, Routes } from 'react-router'

import { AccountPage } from '@/pages/account'
import { HomePage } from '@/pages/home'
import { RegisterPage } from '@/pages/register/RegisterPage'
import { RegisterFFPage } from '@/pages/register/RegisterFFPage'
import { RegisterFinalistPage } from '@/pages/register/RegisterFinalistPage'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/account" element={<Navigate to="/account/personal" replace />} />
      <Route path="/account/:section" element={<AccountPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/register/ff" element={<RegisterFFPage />} />
      <Route path="/register/finalist" element={<RegisterFinalistPage />} />
    </Routes>
  )
}