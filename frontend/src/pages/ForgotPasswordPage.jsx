import { useState } from 'react'
import { ArrowLeft, KeyRound, Mail } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { apiRequest } from '../context/authApi.js'
import { fieldClass, labelClass } from '../components/ui.jsx'

export default function ForgotPasswordPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const initialEmail = new URLSearchParams(location.search).get('email') || ''
  const [stage, setStage] = useState('request')
  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function requestCode(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await apiRequest('/api/auth/password-reset/request', {
        method: 'POST',
        token: '',
        body: { email },
      })
      setStage('reset')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function resetPassword(event) {
    event.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      await apiRequest('/api/auth/password-reset/complete', {
        method: 'POST',
        token: '',
        body: { email, code, password },
      })
      navigate(`/login?reset=1&email=${encodeURIComponent(email)}`, { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-xl rounded-sm border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
      <span className="grid size-10 place-items-center rounded-sm bg-sky-50 text-sky-800">{stage === 'request' ? <Mail size={19} /> : <KeyRound size={19} />}</span>
      <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-sky-800">Account recovery</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-slate-950">{stage === 'request' ? 'Forgot password?' : 'Enter your reset code'}</h1>
      <p className="mt-2 text-xs leading-5 text-slate-500">{stage === 'request' ? 'We’ll email a six-digit code if an account exists for that address.' : `Enter the six-digit code sent to ${email}, then choose a new password.`}</p>
      {error && <p className="mt-5 rounded-sm border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-800" role="alert">{error}</p>}

      {stage === 'request' ? (
        <form className="mt-6 space-y-4" onSubmit={requestCode}>
          <label className={labelClass}>Email address<input className={fieldClass} autoComplete="email" name="email" type="email" required maxLength="160" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
          <button className="min-h-11 w-full rounded-sm bg-sky-800 px-4 text-xs font-extrabold text-white hover:bg-sky-900 disabled:cursor-wait disabled:opacity-60" type="submit" disabled={submitting}>{submitting ? 'Sending code…' : 'Send reset code'}</button>
        </form>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={resetPassword}>
          <label className={labelClass}>Six-digit email code<input className={`${fieldClass} tracking-[0.16em]`} autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" minLength="6" maxLength="6" required value={code} onChange={(event) => setCode(event.target.value)} placeholder="000000" /></label>
          <label className={labelClass}>New password<input className={fieldClass} autoComplete="new-password" type="password" minLength="8" maxLength="128" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /></label>
          <label className={labelClass}>Confirm new password<input className={fieldClass} autoComplete="new-password" type="password" minLength="8" maxLength="128" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Enter the new password again" /></label>
          <button className="min-h-11 w-full rounded-sm bg-sky-800 px-4 text-xs font-extrabold text-white hover:bg-sky-900 disabled:cursor-wait disabled:opacity-60" type="submit" disabled={submitting}>{submitting ? 'Resetting password…' : 'Reset password'}</button>
          <button className="mx-auto flex min-h-9 items-center gap-1.5 px-3 text-xs font-bold text-sky-800 hover:text-sky-950" type="button" onClick={() => { setStage('request'); setCode(''); setError('') }}><Mail size={14} />Use a different email</button>
        </form>
      )}

      <p className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-600"><Link className="inline-flex items-center gap-1.5 font-extrabold text-sky-800 hover:text-sky-950" to="/login"><ArrowLeft size={14} /> Back to Login</Link></p>
    </section>
  )
}
