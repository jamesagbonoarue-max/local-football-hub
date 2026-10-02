import { useState } from 'react'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import { fieldClass, labelClass } from '../components/ui.jsx'

export default function CreateAccountPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      await register({ name: form.name, email: form.email, password: form.password })
      navigate('/login?created=1', { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-xl rounded-sm border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-sky-800">Join the league</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-slate-950">Create an account</h1>
      <p className="mt-2 text-xs leading-5 text-slate-500">Set up a user account to access league services.</p>
      {error && <p className="mt-5 rounded-sm border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-800" role="alert">{error}</p>}

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className={labelClass}>Full name<input className={fieldClass} autoComplete="name" name="name" required minLength="2" maxLength="80" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Your name" /></label>
        <label className={labelClass}>Email address<input className={fieldClass} autoComplete="email" name="email" type="email" required maxLength="160" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></label>
        <label className={labelClass}>Password<span className="relative mt-1 block"><input className={`${fieldClass} pr-12`} autoComplete="new-password" name="password" type={showPassword ? 'text' : 'password'} required minLength="8" maxLength="128" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 8 characters" /><button className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-500 hover:text-slate-900" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
        <label className={labelClass}>Confirm password<input className={fieldClass} autoComplete="new-password" name="confirmPassword" type="password" required minLength="8" maxLength="128" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} placeholder="Enter your password again" /></label>
        <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-sm bg-sky-800 px-4 text-xs font-extrabold text-white hover:bg-sky-900 disabled:cursor-wait disabled:opacity-60" type="submit" disabled={submitting}>{submitting ? 'Creating account…' : <><UserPlus size={16} /> Create account</>}</button>
      </form>

      <p className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-600">Already have an account? <Link className="font-extrabold text-sky-800 hover:text-sky-950" to="/login">Log in</Link></p>
    </section>
  )
}
