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

  if (loading) return <p className="py-16 text-center text-sm text-slate-500">Checking your session…</p>
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

function RequireUser({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <p className="py-16 text-center text-sm text-slate-500">Checking your session…</p>
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
