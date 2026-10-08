import { useEffect, useState } from 'react'
import { CalendarDays, ClipboardList, Home, LogOut, Menu, Shield, UsersRound, X } from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useLeague } from '../context/useLeague.js'
import { useAuth } from '../context/useAuth.js'

const leagueLogoUrl = '/big-boyz-fc-logo.png'

const links = [
  { label: 'Overview', to: '/', icon: Home, end: true },
  { label: 'Matches', to: '/matches', icon: ClipboardList },
  { label: 'Fixtures', to: '/fixtures', icon: CalendarDays },
  { label: 'Team registration', to: '/register', icon: UsersRound },
]

export default function SiteLayout() {
  const { leagueName } = useLeague()
  const { user, logout, sessionNeedsLogin } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [logoError, setLogoError] = useState(false)

  useEffect(() => {
    document.title = `${leagueName} | Football Hub`
  }, [leagueName])

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="bg-slate-950 text-slate-300">
        <div className="mx-auto flex min-h-8 max-w-7xl items-center justify-between gap-3 px-4 text-[10px] font-bold uppercase tracking-[0.12em] sm:px-6 lg:px-8">
          <span>Community football <span className="mx-2 text-slate-600">/</span> League office</span>
          <span className="inline-flex items-center gap-2"><span className="size-1.5 rounded-full bg-lime-400" /> Season centre</span>
        </div>
      </div>
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <NavLink className="flex min-w-0 items-center gap-3" to="/" aria-label={`${leagueName} home`} onClick={() => setMenuOpen(false)}>
            {logoError ? (
              <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-sky-800 font-display text-lg font-bold text-white">BB</span>
            ) : (
              <img className="size-10 shrink-0 rounded-sm border border-slate-200 bg-slate-950 object-contain" src={leagueLogoUrl} alt={`${leagueName} logo`} onError={() => setLogoError(true)} />
            )}
            <span className="min-w-0">
              <strong className="block max-w-48 truncate text-sm font-extrabold text-slate-950 sm:max-w-64">{leagueName}</strong>
              <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.17em] text-slate-500">Football hub</span>
            </span>
          </NavLink>
          {user && <>
            <button className="grid size-10 shrink-0 place-items-center rounded-sm border border-slate-200 text-slate-700 md:hidden" type="button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
            <nav className={`${menuOpen ? 'absolute left-0 right-0 top-full flex border-b border-slate-200 bg-white px-4 pb-3 shadow-lg' : 'hidden'} flex-col gap-1 md:static md:flex md:flex-row md:items-center md:gap-1 md:border-0 md:bg-transparent md:p-0 md:shadow-none`} aria-label="Main navigation">
              {links.map(({ label, to, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} onClick={() => setMenuOpen(false)} className={({ isActive }) => `flex min-h-10 items-center gap-2 rounded-sm px-3 text-xs font-bold transition ${isActive ? 'bg-sky-50 text-sky-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}>
                  <Icon size={15} />{label}
                </NavLink>
              ))}
              {user.role === 'admin' && <NavLink to="/admin" onClick={() => setMenuOpen(false)} className={({ isActive }) => `ml-0 mt-1 flex min-h-10 items-center gap-2 rounded-sm px-3 text-xs font-bold transition md:ml-2 md:mt-0 ${isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}><Shield size={15} />Admin</NavLink>}
              <div className="ml-0 mt-1 flex min-h-10 items-center gap-2 border-t border-slate-100 pt-2 md:ml-2 md:mt-0 md:border-0 md:pt-0">
                <span className="flex min-w-0 items-center gap-2 px-2" aria-label={`Signed in as ${user.name}, ${user.role}`}>
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sky-100 text-[11px] font-extrabold text-sky-900">{user.name.trim().charAt(0).toUpperCase()}</span>
                  <span className="min-w-0"><span className="block max-w-28 truncate text-[10px] font-bold text-slate-800">{user.name}</span><span className="block text-[9px] font-semibold uppercase tracking-wide text-slate-500">{user.role === 'admin' ? 'Administrator' : 'Member'}</span></span>
                </span>
                <button className="inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50" type="button" onClick={() => { logout(); setMenuOpen(false) }}><LogOut size={14} />Log out</button>
              </div>
            </nav>
          </>}
        </div>
      </header>
      {sessionNeedsLogin && <div className="border-b border-amber-200 bg-amber-50">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold leading-5 text-amber-950">Your saved sign-in could not be verified. The page will stay open, but administrator actions require signing in again.</p>
          <button className="min-h-9 shrink-0 rounded-sm bg-amber-900 px-3 text-xs font-bold text-white hover:bg-amber-950" type="button" onClick={() => { logout(); navigate(`/login?next=${encodeURIComponent(location.pathname)}`) }}>Sign in again</button>
        </div>
      </div>}
      <main className="mx-auto min-h-[calc(100vh-168px)] max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>{leagueName}</span>
          <span>Local football, shared locally</span>
          <div className="flex flex-col gap-1 sm:items-end">
            <span>Developed by Agbonoarue Destiny</span>
            <div className="flex flex-wrap gap-x-3 gap-y-1 normal-case tracking-normal">
              <a className="hover:text-sky-800" href="mailto:jamesagbonoarue@gmail.com">jamesagbonoarue@gmail.com</a>
              <a className="hover:text-sky-800" href="tel:09039376584">09039376584</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
