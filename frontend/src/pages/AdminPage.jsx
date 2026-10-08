import { useEffect, useRef, useState } from 'react'
import { Check, ImagePlus, MailPlus, Newspaper, Plus, RefreshCw, Shield, Trash2, Upload, UsersRound } from 'lucide-react'
import { useLeague } from '../context/useLeague.js'
import { apiRequest } from '../context/authApi.js'
import { EmptyState, fieldClass, labelClass, MatchListItem, PageHeading, panelClass, TeamIdentity } from '../components/ui.jsx'

const newMatch = () => ({ id: '', homeTeam: '', awayTeam: '', date: '', kickoff: '', venue: '', status: 'scheduled', homeScore: '', awayScore: '' })
const newUpdate = () => ({ title: '', body: '' })

async function loadAdminAccessLists() {
  const [invitationResult, accountResult, registrationResult] = await Promise.all([
    apiRequest('/api/admin/invitations'),
    apiRequest('/api/admin/accounts'),
    apiRequest('/api/admin/registrations'),
  ])
  return {
    invitations: invitationResult.invitations,
    administrators: accountResult.administrators,
    registrations: registrationResult.registrations,
  }
}

export default function AdminPage() {
  const {
    leagueName,
    matchTableUrl,
    setLeagueName,
    uploadMatchTable,
    removeMatchTable,
    matches,
    addMatch,
    updateMatch,
    removeMatch,
    updates,
    addUpdate,
    removeUpdate,
    approveRegistration,
    removeRegistration,
    updateRegistration,
    teams,
    removeTeam,
  } = useLeague()
  const [nameInputOverride, setNameInputOverride] = useState(null)
  const nameInput = nameInputOverride ?? leagueName
  const [matchForm, setMatchForm] = useState(newMatch)
  const [matchError, setMatchError] = useState('')
  const [editingRegistration, setEditingRegistration] = useState('')
  const [registrationForm, setRegistrationForm] = useState({ teamName: '', division: '', managerName: '', email: '', phone: '', homeGround: '' })
  const [registrationLogo, setRegistrationLogo] = useState(null)
  const [logoRegistrationId, setLogoRegistrationId] = useState('')
  const [registrationError, setRegistrationError] = useState('')
  const [updateForm, setUpdateForm] = useState(newUpdate)
  const [notice, setNotice] = useState('')
  const [leagueError, setLeagueError] = useState('')
  const [matchTableFile, setMatchTableFile] = useState(null)
  const [matchTableError, setMatchTableError] = useState('')
  const [matchTableBusy, setMatchTableBusy] = useState(false)
  const matchTableInputRef = useRef(null)
  const [invitationForm, setInvitationForm] = useState({ name: '', email: '' })
  const [invitations, setInvitations] = useState([])
  const [administrators, setAdministrators] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [invitationError, setInvitationError] = useState('')
  const [sendingInvitation, setSendingInvitation] = useState(false)
  const [refreshingAccess, setRefreshingAccess] = useState(false)

  useEffect(() => {
    let active = true
    let inFlight = false
    let refreshTimer
    const refresh = async () => {
      if (!active || document.visibilityState !== 'visible' || inFlight) return
      inFlight = true
      try {
        const result = await loadAdminAccessLists()
        if (!active) return
        setInvitations(result.invitations)
        setAdministrators(result.administrators)
        setRegistrations(result.registrations)
      } catch (error) {
        if (active) setInvitationError(error.message)
      } finally {
        inFlight = false
        if (active && document.visibilityState === 'visible') {
          refreshTimer = window.setTimeout(refresh, 30000)
        }
      }
    }
    const handleVisibilityChange = () => {
      window.clearTimeout(refreshTimer)
      if (document.visibilityState === 'visible') refresh()
    }
    refresh()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      active = false
      window.clearTimeout(refreshTimer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  async function refreshAdminAccess() {
    setRefreshingAccess(true)
    setInvitationError('')
    try {
      const result = await loadAdminAccessLists()
      setInvitations(result.invitations)
      setAdministrators(result.administrators)
      setRegistrations(result.registrations)
    } catch (error) {
      setInvitationError(error.message)
    } finally {
      setRefreshingAccess(false)
    }
  }

  async function sendAdminInvitation(event) {
    event.preventDefault()
    setInvitationError('')
    setSendingInvitation(true)
    try {
      const result = await apiRequest('/api/admin/invitations', { method: 'POST', body: invitationForm })
      setInvitations((current) => [result.invitation, ...current])
      setInvitationForm({ name: '', email: '' })
      setNotice(result.message)
    } catch (error) {
      setInvitationError(error.message)
    } finally {
      setSendingInvitation(false)
    }
  }

  async function saveLeague(event) {
    event.preventDefault()
    setLeagueError('')
    try {
      await setLeagueName(nameInput)
      setNotice('League name saved for all users.')
      setNameInputOverride(null)
    } catch (error) {
      setLeagueError(error.message)
    }
  }

  async function saveMatchTable(event) {
    event.preventDefault()
    setMatchTableError('')
    if (!matchTableFile) {
      setMatchTableError('Choose a match table image to upload.')
      return
    }

    const form = event.currentTarget
    const formData = new FormData()
    formData.append('image', matchTableFile)
    setMatchTableBusy(true)
    try {
      const result = await uploadMatchTable(formData)
      setMatchTableFile(null)
      form.reset()
      setNotice(result.warning || 'Match table image uploaded and published to the overview.')
    } catch (error) {
      setMatchTableError(error.message)
    } finally {
      setMatchTableBusy(false)
    }
  }

  async function deleteMatchTable() {
    setMatchTableError('')
    setMatchTableBusy(true)
    try {
      const result = await removeMatchTable()
      setMatchTableFile(null)
      if (matchTableInputRef.current) matchTableInputRef.current.value = ''
      setNotice(result.warning || 'Match table image removed from the overview.')
    } catch (error) {
      setMatchTableError(error.message)
    } finally {
      setMatchTableBusy(false)
    }
  }

  async function saveMatch(event) {
    event.preventDefault()
    setMatchError('')
    try {
      const match = {
        ...matchForm,
        homeTeam: matchForm.homeTeam.trim(),
        awayTeam: matchForm.awayTeam.trim(),
        venue: matchForm.venue.trim(),
        homeScore: matchForm.status === 'completed' ? Number(matchForm.homeScore) : null,
        awayScore: matchForm.status === 'completed' ? Number(matchForm.awayScore) : null,
      }
      if (matchForm.id) {
        await updateMatch(matchForm.id, match)
        setNotice('Match changes saved to the shared league schedule.')
      } else {
        await addMatch(match)
        setNotice('Match saved and published to the shared league schedule.')
      }
      setMatchForm(newMatch())
    } catch (error) {
      setMatchError(error.message)
    }
  }

  function editMatch(match) {
    setMatchError('')
    setMatchForm({
      ...match,
      homeScore: match.homeScore ?? '',
      awayScore: match.awayScore ?? '',
    })
  }

  function prepareResult(match) {
    setMatchError('')
    setMatchForm({
      ...match,
      status: 'completed',
      homeScore: match.homeScore ?? '',
      awayScore: match.awayScore ?? '',
    })
    setNotice(`Enter the final score for ${match.homeTeam} versus ${match.awayTeam}, then publish the result.`)
  }

  async function deleteMatch(id) {
    setMatchError('')
    try {
      await removeMatch(id)
      setNotice('Match removed from the shared league schedule.')
    } catch (error) {
      setMatchError(error.message)
    }
  }

  function editRegistration(registration) {
    setRegistrationError('')
    setEditingRegistration(registration.id)
    setRegistrationForm({
      teamName: registration.teamName,
      division: registration.division,
      managerName: registration.managerName,
      email: registration.email,
      phone: registration.phone || '',
      homeGround: registration.homeGround || '',
    })
    setRegistrationLogo(null)
  }

  async function saveRegistration(event) {
    event.preventDefault()
    setRegistrationError('')
    try {
      const formData = new FormData()
      Object.entries(registrationForm).forEach(([key, value]) => formData.append(key, value))
      if (registrationLogo) formData.append('logo', registrationLogo)
      const updated = await updateRegistration(editingRegistration, formData)
      setRegistrations((current) => current.map((item) => item.id === updated.id ? updated : item))
      setEditingRegistration('')
      setRegistrationLogo(null)
      setNotice('Registration details saved to MongoDB.')
    } catch (error) {
      setRegistrationError(error.message)
    }
  }

  async function uploadRegistrationLogo(event) {
    event.preventDefault()
    setRegistrationError('')
    const registration = registrations.find((item) => item.id === logoRegistrationId)
    if (!registration || !registrationLogo) {
      setRegistrationError('Choose a pending application and an image file.')
      return
    }
    const formData = new FormData()
    for (const key of ['teamName', 'division', 'managerName', 'email', 'phone', 'homeGround']) {
      formData.append(key, registration[key] || '')
    }
    formData.append('logo', registrationLogo)
    try {
      const updated = await updateRegistration(registration.id, formData)
      setRegistrations((current) => current.map((item) => item.id === updated.id ? updated : item))
      setRegistrationLogo(null)
      event.currentTarget.reset()
      setNotice(`Logo saved for ${updated.teamName}.`)
    } catch (error) {
      setRegistrationError(error.message)
    }
  }

  async function setRegistrationStatus(registration, status) {
    setRegistrationError('')
    try {
      if (status === 'approved') {
        await approveRegistration(registration.id)
      } else {
        await removeRegistration(registration.id)
      }
      setRegistrations((current) => current.filter((item) => item.id !== registration.id))
      setNotice(status === 'approved' ? `${registration.teamName} approved and added to the public team directory.` : `${registration.teamName} rejected.`)
    } catch (error) {
      setRegistrationError(error.message)
    }
  }

  async function saveUpdate(event) {
    event.preventDefault()
    try {
      await addUpdate({ title: updateForm.title.trim(), body: updateForm.body.trim() })
      setUpdateForm(newUpdate())
      setNotice('League update published for all users.')
    } catch (error) {
      setNotice(error.message)
    }
  }

  async function deleteUpdate(id) {
    try {
      await removeUpdate(id)
      setNotice('League update removed for all users.')
    } catch (error) {
      setNotice(error.message)
    }
  }

  const orderedMatches = [...matches].sort((left, right) => String(left.date || '').localeCompare(String(right.date || '')))
  const orderedUpdates = [...updates].sort((left, right) => String(right.createdAt || '').localeCompare(String(left.createdAt || '')))
  const selectedLogoRegistration = registrations.find((registration) => registration.id === logoRegistrationId)

  return (
    <>
      <PageHeading eyebrow="League office" title="Admin" description="Manage the public league schedule, announcements and team directory." />
      <div className="mb-6 flex items-start gap-3 rounded-sm border border-amber-200 bg-amber-50 p-4 text-amber-950">
        <Shield size={17} className="mt-0.5 shrink-0" />
        <p className="text-xs leading-5"><strong>Administrator access verified.</strong> Matches, results, league updates, team registrations, league settings and approvals are shared through MongoDB. Match table images are hosted on Cloudinary.</p>
      </div>
      {notice && <p className="mb-5 rounded-sm border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-900" role="status">{notice}</p>}

      <section className={`${panelClass} mb-5 p-5 sm:p-6`}>
        <div className="mb-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-sky-800">Administrator access</p><h2 className="mt-1 font-display text-2xl font-bold text-slate-950">Invite another admin</h2><p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500">We email the invitee a one-time verification code and a generated admin sign-in ID. The code expires after 24 hours. After verification, the admin moves from Pending invitations to Active administrators.</p></div>
        {invitationError && <p className="mb-4 rounded-sm border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-800" role="alert">{invitationError}</p>}
        <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end" onSubmit={sendAdminInvitation}>
          <label className={labelClass}>Invitee name<input className={fieldClass} autoComplete="name" value={invitationForm.name} onChange={(event) => setInvitationForm({ ...invitationForm, name: event.target.value })} required minLength="2" maxLength="80" placeholder="Full name" /></label>
          <label className={labelClass}>Invitee email<input className={fieldClass} autoComplete="email" type="email" value={invitationForm.email} onChange={(event) => setInvitationForm({ ...invitationForm, email: event.target.value })} required maxLength="160" placeholder="admin@example.com" /></label>
          <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-sm bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60" type="submit" disabled={sendingInvitation}><MailPlus size={15} />{sendingInvitation ? 'Sending…' : 'Send invitation'}</button>
        </form>
        <div className="mt-5 border-t border-slate-200 pt-4">
          <div className="flex items-center justify-between gap-3"><h3 className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-600">Pending invitations <span className="ml-1 text-slate-400">{invitations.length}</span></h3><button className="inline-flex min-h-8 items-center gap-1.5 rounded-sm px-2 text-[10px] font-bold text-sky-800 hover:bg-sky-50 disabled:opacity-50" type="button" onClick={refreshAdminAccess} disabled={refreshingAccess} aria-label="Refresh administrator status" title="Refresh administrator status"><RefreshCw size={13} className={refreshingAccess ? 'animate-spin' : ''} />Refresh</button></div>
          {invitations.length ? <ul className="mt-2 divide-y divide-slate-100">{invitations.map((invitation) => <li className="flex flex-wrap items-center justify-between gap-2 py-3" key={invitation.id}><span><strong className="block text-sm text-slate-900">{invitation.name}</strong><span className="text-xs text-slate-500">{invitation.email}</span></span><span className="text-[10px] font-semibold text-slate-500">Expires {new Date(invitation.expiresAt).toLocaleString()}</span></li>)}</ul> : !invitationError && <p className="pt-3 text-sm text-slate-500">No pending invitations.</p>}
        </div>
        <div className="mt-5 border-t border-slate-200 pt-4">
          <h3 className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-600">Active administrators <span className="ml-1 text-slate-400">{administrators.length}</span></h3>
          {administrators.length ? <ul className="mt-2 divide-y divide-slate-100">{administrators.map((administrator) => <li className="flex flex-wrap items-center justify-between gap-2 py-3" key={administrator.id}><span><strong className="block text-sm text-slate-900">{administrator.name}</strong><span className="text-xs text-slate-500">{administrator.email}</span></span><span className="rounded-sm bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-800">Active</span></li>)}</ul> : !invitationError && <p className="pt-3 text-sm text-slate-500">No active administrators found.</p>}
        </div>
      </section>

      <section className={`${panelClass} mb-5 p-5 sm:p-6`}>
        <div className="mb-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-sky-800">Public identity</p><h2 className="mt-1 font-display text-2xl font-bold text-slate-950">League settings</h2></div>
        <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={saveLeague}>
          <label className={`${labelClass} flex-1`}>League name<input className={fieldClass} value={nameInput} onChange={(event) => setNameInputOverride(event.target.value)} required maxLength="100" /></label>
          <button className="min-h-10 rounded-sm bg-slate-900 px-5 text-xs font-bold text-white hover:bg-slate-800" type="submit">Save league name</button>
        </form>
        {leagueError && <p className="mt-3 rounded-sm border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-800" role="alert">{leagueError}</p>}
      </section>

      <section className={`${panelClass} mb-5 overflow-hidden`}>
        <div className="border-b border-slate-200 p-5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-sky-50 text-sky-800"><ImagePlus size={18} /></span>
            <div><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-sky-800">Overview content</p><h2 className="mt-0.5 font-display text-2xl font-bold text-slate-950">Match table image</h2></div>
          </div>
          <p className="mt-3 max-w-2xl text-xs leading-5 text-slate-500">Upload a JPG, PNG, WebP, or GIF (up to 5 MB). The image is stored in Cloudinary and shown to everyone on the overview page.</p>
        </div>
        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
          <div>
            {matchTableError && <p className="mb-4 rounded-sm border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-800" role="alert">{matchTableError}</p>}
            <form className="space-y-3" onSubmit={saveMatchTable}>
              <label className={labelClass}>Choose image<input ref={matchTableInputRef} className={fieldClass} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setMatchTableFile(event.target.files[0] || null)} required /></label>
              {matchTableFile && <p className="text-xs text-slate-500">Selected: {matchTableFile.name}</p>}
              <div className="flex flex-wrap gap-2">
                <button className="inline-flex min-h-10 items-center gap-2 rounded-sm bg-sky-800 px-4 text-xs font-extrabold text-white hover:bg-sky-900 disabled:cursor-not-allowed disabled:opacity-50" type="submit" disabled={!matchTableFile || matchTableBusy}><Upload size={15} />{matchTableBusy ? 'Working…' : 'Upload and publish'}</button>
                {matchTableUrl && <button className="inline-flex min-h-10 items-center gap-2 rounded-sm border border-rose-200 px-4 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50" type="button" onClick={deleteMatchTable} disabled={matchTableBusy}><Trash2 size={14} />Remove image</button>}
              </div>
            </form>
          </div>
          <div className="flex min-h-44 items-center justify-center overflow-hidden rounded-sm border border-slate-200 bg-slate-950 p-3">
            {matchTableUrl
              ? <img className="max-h-80 w-full object-contain" src={matchTableUrl} alt="Current match table image" />
              : <div className="px-4 py-8 text-center"><ImagePlus className="mx-auto text-slate-500" size={28} /><p className="mt-3 text-xs font-semibold text-slate-300">No match table image published</p><p className="mt-1 text-[10px] text-slate-500">Upload an image to add it to the overview.</p></div>}
          </div>
        </div>
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-2">
        <section className={`${panelClass} p-5 sm:p-6`}>
          <div className="mb-5"><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-sky-800">Schedule and results</p><h2 className="mt-1 font-display text-2xl font-bold text-slate-950">{matchForm.id ? 'Edit match' : 'Add a match'}</h2></div>
          {matchError && <p className="mb-4 rounded-sm border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-800" role="alert">{matchError}</p>}
          <form className="space-y-4" onSubmit={saveMatch}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={labelClass}>Home team<select className={fieldClass} value={matchForm.homeTeam} onChange={(event) => setMatchForm({ ...matchForm, homeTeam: event.target.value })} required><option value="">Select a registered team</option>{teams.map((team) => <option key={team.id} value={team.teamName} disabled={team.teamName === matchForm.awayTeam}>{team.teamName}</option>)}</select>{teams.find((team) => team.teamName === matchForm.homeTeam) && <TeamIdentity className="mt-2" teamName={matchForm.homeTeam} logoUrl={teams.find((team) => team.teamName === matchForm.homeTeam).logoUrl} />}</label>
              <label className={labelClass}>Away team<select className={fieldClass} value={matchForm.awayTeam} onChange={(event) => setMatchForm({ ...matchForm, awayTeam: event.target.value })} required><option value="">Select a registered team</option>{teams.map((team) => <option key={team.id} value={team.teamName} disabled={team.teamName === matchForm.homeTeam}>{team.teamName}</option>)}</select>{teams.find((team) => team.teamName === matchForm.awayTeam) && <TeamIdentity className="mt-2" teamName={matchForm.awayTeam} logoUrl={teams.find((team) => team.teamName === matchForm.awayTeam).logoUrl} />}</label>
              {teams.length < 2 && <p className="text-xs font-semibold text-amber-800 sm:col-span-2">Approve at least two registered teams before publishing a match.</p>}
              <label className={labelClass}>Match date<input className={fieldClass} type="date" value={matchForm.date} onChange={(event) => setMatchForm({ ...matchForm, date: event.target.value })} required /></label>
              <label className={labelClass}>Kick-off<input className={fieldClass} type="time" value={matchForm.kickoff} onChange={(event) => setMatchForm({ ...matchForm, kickoff: event.target.value })} required /></label>
              <label className={`${labelClass} sm:col-span-2`}>Venue<input className={fieldClass} value={matchForm.venue} onChange={(event) => setMatchForm({ ...matchForm, venue: event.target.value })} maxLength="120" placeholder="Optional" /></label>
              <label className={labelClass}>Status<select className={fieldClass} value={matchForm.status} onChange={(event) => setMatchForm({ ...matchForm, status: event.target.value })}><option value="scheduled">Scheduled fixture</option><option value="completed">Completed result</option></select></label>
              {matchForm.status === 'completed' && <>
                <label className={labelClass}>Home score<input className={fieldClass} type="number" min="0" max="99" value={matchForm.homeScore} onChange={(event) => setMatchForm({ ...matchForm, homeScore: event.target.value })} required /></label>
                <label className={labelClass}>Away score<input className={fieldClass} type="number" min="0" max="99" value={matchForm.awayScore} onChange={(event) => setMatchForm({ ...matchForm, awayScore: event.target.value })} required /></label>
              </>}
            </div>
            <div className="flex flex-wrap gap-2"><button className="inline-flex min-h-10 items-center gap-2 rounded-sm bg-sky-800 px-4 text-xs font-extrabold text-white hover:bg-sky-900" type="submit"><Plus size={15} /> {matchForm.id ? 'Save match changes' : 'Publish match'}</button>{matchForm.id && <button className="min-h-10 rounded-sm border border-slate-300 px-4 text-xs font-bold text-slate-600 hover:bg-slate-50" type="button" onClick={() => setMatchForm(newMatch())}>Cancel edit</button>}</div>
          </form>
          <div className="mt-6 border-t border-slate-200 pt-4">
            <h3 className="mb-1 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-600">Published matches <span className="ml-1 text-slate-400">{matches.length}</span></h3>
            {orderedMatches.length ? orderedMatches.map((match) => <MatchListItem key={match.id} match={match} onEdit={() => editMatch(match)} onPublishResult={() => prepareResult(match)} onDelete={() => deleteMatch(match.id)} />) : <p className="py-5 text-sm text-slate-500">No matches have been added.</p>}
          </div>
        </section>

        <section className={`${panelClass} p-5 sm:p-6`}>
          <div className="mb-5"><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-sky-800">Public noticeboard</p><h2 className="mt-1 font-display text-2xl font-bold text-slate-950">League updates</h2></div>
          <form className="space-y-3" onSubmit={saveUpdate}>
            <label className={labelClass}>Headline<input className={fieldClass} value={updateForm.title} onChange={(event) => setUpdateForm({ ...updateForm, title: event.target.value })} required maxLength="120" placeholder="Update headline" /></label>
            <label className={labelClass}>Update<textarea className={`${fieldClass} min-h-28 resize-y`} value={updateForm.body} onChange={(event) => setUpdateForm({ ...updateForm, body: event.target.value })} required maxLength="1200" placeholder="Write the announcement" /></label>
            <button className="inline-flex min-h-10 items-center gap-2 rounded-sm bg-sky-800 px-4 text-xs font-extrabold text-white hover:bg-sky-900" type="submit"><Newspaper size={15} /> Publish update</button>
          </form>
          <div className="mt-6 border-t border-slate-200 pt-4">
            <h3 className="mb-3 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-600">Published updates <span className="ml-1 rounded-sm bg-slate-100 px-1.5 py-0.5 text-slate-500">{updates.length}</span></h3>
            {orderedUpdates.length ? <ul className="space-y-3">{orderedUpdates.map((update) => <li className="flex items-start justify-between gap-3 rounded-sm border border-slate-200 border-l-4 border-l-lime-400 bg-slate-50/70 p-4" key={update.id}><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wide text-sky-800">{new Date(update.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p><p className="mt-1.5 text-sm font-extrabold leading-5 text-slate-950">{update.title}</p><p className="mt-2 whitespace-pre-line text-xs leading-5 text-slate-600">{update.body}</p></div><button className="grid size-9 shrink-0 place-items-center rounded-sm text-slate-400 hover:bg-rose-50 hover:text-rose-700" type="button" aria-label={`Delete update ${update.title}`} onClick={() => deleteUpdate(update.id)}><Trash2 size={15} /></button></li>)}</ul> : <p className="py-5 text-sm text-slate-500">No updates have been published.</p>}
          </div>
        </section>
      </div>

      <div className="mt-5 grid items-start gap-5 xl:grid-cols-2">
        <section className={`${panelClass} p-5 sm:p-6`}>
          <div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-sky-800">Team applications</p><h2 className="mt-1 font-display text-2xl font-bold text-slate-950">Pending review</h2></div><span className="grid size-9 place-items-center rounded-sm bg-sky-50 text-sky-800"><UsersRound size={17} /></span></div>
          {registrationError && <p className="mb-3 rounded-sm border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-800" role="alert">{registrationError}</p>}
          {registrations.length > 0 && <form className="mb-4 grid gap-3 rounded-sm border border-slate-200 p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end" onSubmit={uploadRegistrationLogo}><label className={labelClass}>Application<select className={fieldClass} value={logoRegistrationId} onChange={(event) => setLogoRegistrationId(event.target.value)} required><option value="">Choose a team</option>{registrations.map((registration) => <option key={registration.id} value={registration.id}>{registration.teamName}</option>)}</select>{selectedLogoRegistration && <TeamIdentity className="mt-2" teamName={selectedLogoRegistration.teamName} logoUrl={selectedLogoRegistration.logoUrl} />}</label><label className={labelClass}>Team logo<input className={fieldClass} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setRegistrationLogo(event.target.files[0] || null)} required /></label><button className="min-h-10 rounded-sm bg-sky-800 px-4 text-xs font-extrabold text-white hover:bg-sky-900" type="submit">Upload logo</button></form>}
          {registrations.length ? <ul className="divide-y divide-slate-100">{registrations.map((registration) => <li className="py-4 first:pt-0" key={registration.id}>{editingRegistration === registration.id ? <form className="grid gap-3 sm:grid-cols-2" onSubmit={saveRegistration}><label className={labelClass}>Team name<input className={fieldClass} value={registrationForm.teamName} onChange={(event) => setRegistrationForm({ ...registrationForm, teamName: event.target.value })} required maxLength="80" /></label><label className={labelClass}>Division<input className={fieldClass} value={registrationForm.division} onChange={(event) => setRegistrationForm({ ...registrationForm, division: event.target.value })} required maxLength="60" /></label><label className={labelClass}>Manager<input className={fieldClass} value={registrationForm.managerName} onChange={(event) => setRegistrationForm({ ...registrationForm, managerName: event.target.value })} required maxLength="80" /></label><label className={labelClass}>Email<input className={fieldClass} type="email" value={registrationForm.email} onChange={(event) => setRegistrationForm({ ...registrationForm, email: event.target.value })} required maxLength="160" /></label><label className={labelClass}>Phone<input className={fieldClass} value={registrationForm.phone} onChange={(event) => setRegistrationForm({ ...registrationForm, phone: event.target.value })} maxLength="40" /></label><label className={labelClass}>Home ground<input className={fieldClass} value={registrationForm.homeGround} onChange={(event) => setRegistrationForm({ ...registrationForm, homeGround: event.target.value })} maxLength="100" /></label><div className="flex gap-2 sm:col-span-2"><button className="min-h-9 rounded-sm bg-sky-800 px-3 text-[11px] font-bold text-white hover:bg-sky-900" type="submit">Save details</button><button className="min-h-9 rounded-sm border border-slate-300 px-3 text-[11px] font-bold text-slate-600 hover:bg-slate-50" type="button" onClick={() => setEditingRegistration('')}>Cancel</button></div></form> : <div className="flex flex-wrap items-start justify-between gap-3"><div><TeamIdentity teamName={registration.teamName} logoUrl={registration.logoUrl} nameClassName="text-sm font-bold text-slate-950" /><p className="mt-1 text-xs text-slate-600">{registration.division} {registration.homeGround && `· ${registration.homeGround}`}</p><p className="mt-1 text-xs text-slate-500">{registration.managerName} · {registration.email}{registration.phone && ` · ${registration.phone}`}</p></div><div className="flex flex-wrap gap-2"><button className="min-h-9 rounded-sm border border-slate-300 px-3 text-[11px] font-bold text-slate-600 hover:bg-slate-50" type="button" onClick={() => editRegistration(registration)}>Edit details</button><button className="inline-flex min-h-9 items-center gap-1.5 rounded-sm bg-emerald-700 px-3 text-[11px] font-bold text-white hover:bg-emerald-800" type="button" onClick={() => setRegistrationStatus(registration, 'approved')}><Check size={14} /> Approve</button><button className="min-h-9 rounded-sm border border-rose-200 px-3 text-[11px] font-bold text-rose-700 hover:bg-rose-50" type="button" onClick={() => setRegistrationStatus(registration, 'rejected')}>Reject</button></div></div>}</li>)}</ul> : <EmptyState icon={UsersRound} title="No pending registrations" description="New team applications will appear here for review." />}
        </section>

        <section className={`${panelClass} p-5 sm:p-6`}>
          <div className="mb-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-sky-800">Approved directory</p><h2 className="mt-1 font-display text-2xl font-bold text-slate-950">Registered teams <span className="text-slate-400">{teams.length}</span></h2></div>
          {teams.length ? <ul className="divide-y divide-slate-100">{teams.map((team) => <li className="flex items-center justify-between gap-3 py-3 first:pt-0" key={team.id}><div className="flex min-w-0 items-center gap-3"><div className="min-w-0"><TeamIdentity teamName={team.teamName} logoUrl={team.logoUrl} logoClassName="size-10" fallbackIcon={UsersRound} nameClassName="text-sm font-bold text-slate-900" /><p className="mt-1 text-xs text-slate-500">{team.division || 'Division not set'}{team.homeGround && ` · ${team.homeGround}`}</p></div></div><button className="grid size-9 shrink-0 place-items-center rounded-sm text-slate-400 hover:bg-rose-50 hover:text-rose-700" type="button" aria-label={`Remove ${team.teamName}`} onClick={() => removeTeam(team.id)}><Trash2 size={15} /></button></li>)}</ul> : <EmptyState icon={UsersRound} title="No approved teams" description="Approve a pending registration to add it to the public directory." />}
        </section>
      </div>
    </>
  )
}
