import { useState } from 'react'
import { Check, ClipboardList } from 'lucide-react'
import { useLeague } from '../context/useLeague.js'
import { fieldClass, labelClass, PageHeading, panelClass } from '../components/ui.jsx'

export default function RegistrationPage() {
  const { registerTeam } = useLeague()
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const formElement = event.currentTarget
    setError('')
    setSubmitting(true)
    try {
      const formData = new FormData(formElement)
      await registerTeam(Object.fromEntries(formData.entries()))
      formElement.reset()
      setSubmitted(true)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeading eyebrow="Join the competition" title="Team registration" description="Submit your team details for league review." />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.65fr)]">
        <section className={`${panelClass} p-5 sm:p-7`}>
          {submitted && <div className="mb-5 flex items-start gap-3 rounded-sm border border-emerald-200 bg-emerald-50 p-4 text-emerald-900" role="status"><Check size={17} className="mt-0.5 shrink-0" /><p className="text-sm font-semibold">Registration received. The league administrator can review it in Admin.</p></div>}
          {error && <p className="mb-5 rounded-sm border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-800" role="alert">{error}</p>}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>Team name<input className={fieldClass} name="teamName" required maxLength="80" placeholder="Enter the team name" /></label>
              <label className={labelClass}>Division<input className={fieldClass} name="division" required maxLength="60" placeholder="Division or age group" /></label>
              <label className={labelClass}>Manager name<input className={fieldClass} name="managerName" required maxLength="80" placeholder="Primary contact" /></label>
              <label className={labelClass}>Contact email<input className={fieldClass} name="email" type="email" required maxLength="160" placeholder="manager@example.com" /></label>
              <label className={labelClass}>Phone <span className="font-normal text-slate-400">(optional)</span><input className={fieldClass} name="phone" type="tel" maxLength="40" placeholder="Contact number" /></label>
              <label className={labelClass}>Home ground<input className={fieldClass} name="homeGround" maxLength="100" placeholder="Ground name or address" /></label>
            </div>
            <button className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-sky-800 px-5 text-xs font-extrabold text-white hover:bg-sky-900 disabled:cursor-wait disabled:opacity-60" type="submit" disabled={submitting}><ClipboardList size={16} /> {submitting ? 'Submitting…' : 'Submit registration'}</button>
          </form>
        </section>
        <aside className="rounded-sm border border-sky-200 bg-sky-50 p-5 sm:p-6">
          <span className="grid size-10 place-items-center rounded-sm bg-white text-sky-800"><ClipboardList size={19} /></span>
          <h2 className="mt-4 font-display text-2xl font-bold text-slate-950">Registration review</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">The league accepts up to 70 active teams. Submissions remain pending until an administrator approves them. Approved teams appear in the league directory.</p>
          <p className="mt-4 border-t border-sky-200 pt-4 text-xs leading-5 text-slate-500">Registration details are stored in the league database and can be reviewed or edited by an administrator.</p>
        </aside>
      </div>
    </>
  )
}
