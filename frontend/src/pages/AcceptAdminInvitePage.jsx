import { useState } from 'react'
import { KeyRound, ShieldCheck } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { apiRequest } from '../context/authApi.js'
import { fieldClass, labelClass } from '../components/ui.jsx'

export default function AcceptAdminInvitePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const invitedEmail = new URLSearchParams(location.search).get('email') || ''
  const [form, setForm] = useState({ name: '', email: invitedEmail, verificationCode: '', password: '', confirmPassword: '' })
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
      await apiRequest('/api/auth/accept-admin-invitation', {
        method: 'POST',
        token: '',
        body: {
          name: form.name,
          email: form.email,
          verificationCode: form.verificationCode,
          password: form.password,
        },
      })
      navigate(`/login?created=admin&email=${encodeURIComponent(form.email)}`, { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-xl rounded-sm border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
      <span className="grid size-10 place-items-center rounded-sm bg-sky-50 text-sky-800"><ShieldCheck size={19} /></span>
      <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-sky-800">Administrator invitation</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-slate-950">Activate your account</h1>
      <p className="mt-2 text-xs leading-5 text-slate-500">Enter the nine-digit verification code from your invitation email and choose a password.</p>
      {error && <p className="mt-5 rounded-sm border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-800" role="alert">{error}</p>}

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className={labelClass}>Full name<input className={fieldClass} autoComplete="name" name="name" required minLength="2" maxLength="80" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Your name" /></label>
        <label className={labelClass}>Invited email<input className={fieldClass} autoComplete="email" name="email" type="email" required maxLength="160" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="The email address the invitation was sent to" /></label>
        <label className={labelClass}>One-time verification code<span className="relative mt-1 block"><KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input className={`${fieldClass} pl-10 tracking-[0.12em]`} autoComplete="one-time-code" name="verificationCode" inputMode="numeric" pattern="[0-9]{9}" minLength="9" maxLength="9" required value={form.verificationCode} onChange={(event) => setForm({ ...form, verificationCode: event.target.value })} placeholder="9-digit code" /></span></label>
        <label className={labelClass}>Create password<input className={fieldClass} autoComplete="new-password" name="password" type="password" required minLength="8" maxLength="128" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 8 characters" /></label>
        <label className={labelClass}>Confirm password<input className={fieldClass} autoComplete="new-password" name="confirmPassword" type="password" required minLength="8" maxLength="128" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} placeholder="Enter your password again" /></label>
        <button className="min-h-11 w-full rounded-sm bg-sky-800 px-4 text-xs font-extrabold text-white hover:bg-sky-900 disabled:cursor-wait disabled:opacity-60" type="submit" disabled={submitting}>{submitting ? 'Activating…' : 'Verify and activate account'}</button>
      </form>
      <p className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-600">Already activated? <Link className="font-extrabold text-sky-800 hover:text-sky-950" to="/login">Log in</Link></p>
    </section>
  )
}
