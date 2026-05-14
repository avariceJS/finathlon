import { Navigate, Route, Routes } from 'react-router'

import { AccountPage } from '@/pages/account'
import {
  AdminCouncilPage,
  AdminDashboardPage,
  AdminDocumentsPage,
  AdminFaqsPage,
  AdminNewsPage,
  AdminNotificationsPage,
  AdminPartnersPage,
  AdminProgramsPage,
  AdminSettingsPage,
  AdminStatsPage,
  AdminTimelinePage,
  AdminUsersPage,
} from '@/pages/admin'
import { AuthPage } from '@/pages/auth'
import { DocumentsPage } from '@/pages/documents'
import { EventsPage } from '@/pages/events'
import { HomePage } from '@/pages/home'
import { NewsDetailPage, NewsListPage } from '@/pages/news'
import { PartnersPage } from '@/pages/partners'

import { AdminRoute, ProtectedRoute } from './guards'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route path="/news" element={<NewsListPage />} />
      <Route path="/news/:slug" element={<NewsDetailPage />} />

      <Route path="/events" element={<EventsPage />} />
      <Route path="/events/:slug" element={<EventsPage />} />

      <Route path="/partners" element={<PartnersPage />} />
      <Route path="/documents" element={<DocumentsPage />} />

      <Route path="/auth" element={<AuthPage />} />

      <Route
        path="/account"
        element={<Navigate to="/account/personal" replace />}
      />
      <Route
        path="/account/:section"
        element={
          <ProtectedRoute>
            <AccountPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboardPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/news"
        element={
          <AdminRoute>
            <AdminNewsPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/programs"
        element={
          <AdminRoute>
            <AdminProgramsPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/partners"
        element={
          <AdminRoute>
            <AdminPartnersPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/council"
        element={
          <AdminRoute>
            <AdminCouncilPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/documents"
        element={
          <AdminRoute>
            <AdminDocumentsPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/faqs"
        element={
          <AdminRoute>
            <AdminFaqsPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/timeline"
        element={
          <AdminRoute>
            <AdminTimelinePage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/stats"
        element={
          <AdminRoute>
            <AdminStatsPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/notifications"
        element={
          <AdminRoute>
            <AdminNotificationsPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <AdminUsersPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <AdminRoute>
            <AdminSettingsPage />
          </AdminRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
