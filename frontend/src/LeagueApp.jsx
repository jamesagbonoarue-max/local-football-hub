import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import SiteLayout from './components/SiteLayout.jsx'
import { AuthProvider } from './context/AuthProvider.jsx'
import { LeagueProvider } from './context/LeagueContext.jsx'
import { useAuth } from './context/useAuth.js'
import AdminPage from './pages/AdminPage.jsx'
import AcceptAdminInvitePage from './pages/AcceptAdminInvitePage.jsx'
import CreateAccountPage from './pages/CreateAccountPage.jsx'
import FixturesPage from './pages/FixturesPage.jsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import MatchesPage from './pages/MatchesPage.jsx'
import RegistrationPage from './pages/RegistrationPage.jsx'

function RequireAdmin({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <SessionCheck />
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

function SessionCheck() {
  return (
    <main className="grid min-h-[60vh] place-items-center px-4" role="status" aria-live="polite">
      <p className="text-sm font-semibold text-slate-600">Checking your session…</p>
    </main>
  )
}

function RequireUser({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <SessionCheck />
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  return children
}

function NotFoundPage() {
  return <div className="py-20 text-center"><h1 className="font-display text-4xl font-bold">Page not found</h1><a className="mt-4 inline-block text-sm font-bold text-sky-800 underline" href="/">Return to overview</a></div>
}

export default function LeagueApp() {
  return (
    <AuthProvider>
      <LeagueProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<SiteLayout />}>
              <Route path="login" element={<LoginPage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
              <Route path="create-account" element={<CreateAccountPage />} />
              <Route path="accept-admin-invite" element={<AcceptAdminInvitePage />} />
            </Route>
            <Route element={<RequireUser><SiteLayout /></RequireUser>}>
              <Route index element={<HomePage />} />
              <Route path="matches" element={<MatchesPage />} />
              <Route path="fixtures" element={<FixturesPage />} />
              <Route path="register" element={<RegistrationPage />} />
              <Route path="admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </LeagueProvider>
    </AuthProvider>
  )
}
