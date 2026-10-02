import { useState } from 'react'
import { Eye, EyeOff, KeyRound, LockKeyhole, LogIn, Shield, UserRound } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import { fieldClass, labelClass } from '../components/ui.jsx'

export default function LoginPage() {
  const { login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const search = new URLSearchParams(location.search)
  const created = search.get('created')
  const createdAccount = created === '1'
  const activatedAdmin = created === 'admin'
  const passwordReset = search.get('reset') === '1'
  const requestedPath = search.get('next') || ''
  const safeRequestedPath = requestedPath.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : ''
  const [role, setRole] = useState('user')
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: search.get('email') || '', password: '', adminId: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const user = await login({ ...form, role })
      navigate(user.role === 'admin' ? (safeRequestedPath || '/admin') : '/', { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto grid max-w-4xl overflow-hidden rounded-sm border border-slate-200 bg-white shadow-sm md:grid-cols-[0.85fr_1.15fr]">
      <div className="relative hidden min-h-[510px] flex-col justify-between overflow-hidden bg-slate-950 p-8 text-white md:flex">
        <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(8,47,73,0.95),rgba(12,69,112,0.8)),url('https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=900&q=80')] bg-cover bg-center" />
        <div className="relative"><span className="grid size-11 place-items-center rounded-sm border border-white/30 bg-white/10"><LockKeyhole size={20} /></span><p className="mt-8 text-[10px] font-extrabold uppercase tracking-[0.2em] text-lime-300">League portal</p><h1 className="mt-3 font-display text-4xl font-bold leading-[0.95]">Good to have you on the team.</h1></div>
        <p className="relative max-w-xs text-xs leading-5 text-slate-300">Sign in to manage your account or access league administration.</p>
      </div>

      <div className="p-6 sm:p-9">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-sky-800">Welcome back</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-slate-950">Log in</h2>
        <p className="mt-2 text-xs leading-5 text-slate-500">Choose your account access and enter your credentials.</p>

        {createdAccount && <p className="mt-5 rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-900" role="status">Account created. You can sign in now.</p>}
        {activatedAdmin && <p className="mt-5 rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-900" role="status">Administrator account activated. Use the generated administrator ID from your email to sign in.</p>}
        {passwordReset && <p className="mt-5 rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-900" role="status">Password reset successfully. Sign in with your new password.</p>}
        {error && <p className="mt-5 rounded-sm border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-800" role="alert">{error}</p>}

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div>
            <span className={labelClass}>Sign in as</span>
            <div className="mt-1 grid grid-cols-2 gap-2" role="group" aria-label="Choose account access">
              <button className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-sm border text-xs font-bold ${role === 'user' ? 'border-sky-800 bg-sky-50 text-sky-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`} type="button" aria-pressed={role === 'user'} onClick={() => setRole('user')}><UserRound size={15} /> User</button>
              <button className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-sm border text-xs font-bold ${role === 'admin' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`} type="button" aria-pressed={role === 'admin'} onClick={() => setRole('admin')}><Shield size={15} /> Admin</button>
            </div>
          </div>

          <label className={labelClass}>Email address<input className={fieldClass} autoComplete="email" name="email" type="email" required maxLength="160" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></label>
          <label className={labelClass}>Password<span className="relative mt-1 block"><input className={`${fieldClass} pr-12`} autoComplete="current-password" name="password" type={showPassword ? 'text' : 'password'} required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Enter your password" /><button className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-500 hover:text-slate-900" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
          {role === 'user' && <div className="-mt-2 text-right"><Link className="text-xs font-bold text-sky-800 hover:text-sky-950" to={`/forgot-password?email=${encodeURIComponent(form.email)}`}>Forgot password?</Link></div>}

          {role === 'admin' && <label className={labelClass}>Administrator ID<span className="relative mt-1 block"><KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input className={`${fieldClass} pl-10`} autoComplete="off" name="adminId" required value={form.adminId} onChange={(event) => setForm({ ...form, adminId: event.target.value })} placeholder="Enter your special ID" /></span><span className="mt-1 block font-normal text-slate-500">Required for administrator access.</span></label>}

          <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-sm bg-sky-800 px-4 text-xs font-extrabold text-white hover:bg-sky-900 disabled:cursor-wait disabled:opacity-60" type="submit" disabled={submitting}>{submitting ? 'Signing in…' : <><LogIn size={16} /> Sign in as {role === 'admin' ? 'admin' : 'user'}</>}</button>
        </form>

        <p className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-600">New to the league? <Link className="font-extrabold text-sky-800 hover:text-sky-950" to="/create-account">Create an account</Link></p>
      </div>
    </section>
  )
}
