import { ArrowRight, CalendarDays, CircleHelp, Newspaper, Trophy, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLeague } from '../context/useLeague.js'
import { EmptyState, MatchListItem, panelClass, TeamIdentity } from '../components/ui.jsx'
import { isUpcomingMatch } from '../utils/matchTime.js'

const photoUrl = 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1200&q=85'

export default function HomePage() {
  const { leagueName, matchTableUrl, overviewScheduleUrl, matches, updates, teams } = useLeague()
  const nextFixture = [...matches]
    .filter((match) => match.status === 'scheduled' && isUpcomingMatch(match))
    .sort((left, right) => String(left.date || '').localeCompare(String(right.date || '')))[0]
  const latestMatches = [...matches].sort((left, right) => String(right.date || '').localeCompare(String(left.date || ''))).slice(0, 5)
  const latestUpdates = [...updates].sort((left, right) => String(right.createdAt || '').localeCompare(String(left.createdAt || ''))).slice(0, 3)

  return (
    <>
      <section className="mb-8 grid overflow-hidden rounded-sm bg-slate-950 text-white md:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-center px-6 py-8 sm:px-9 sm:py-10">
          <p className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.19em] text-lime-300"><span className="size-1.5 rounded-full bg-lime-300" /> League office</p>
          <h1 className="max-w-xl font-display text-4xl font-bold leading-[0.96] sm:text-5xl">{leagueName}</h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-slate-300">League matches, fixtures and registered teams, all in one place.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="inline-flex items-center gap-2 rounded-sm bg-lime-300 px-4 py-2.5 text-xs font-extrabold text-slate-950 hover:bg-lime-200" to="/fixtures">View fixtures <ArrowRight size={15} /></Link>
            <Link className="inline-flex items-center gap-2 rounded-sm border border-slate-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800" to="/register">Register a team</Link>
          </div>
        </div>
        <div className="relative min-h-44 bg-sky-900 md:min-h-64">
          <img className="absolute inset-0 size-full object-cover" src={photoUrl} alt="Players meeting on a local football pitch" />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-slate-950/80 px-4 py-3 text-[9px] font-bold uppercase tracking-[0.13em] text-white sm:px-6">
            <span>Community football</span><span className="text-lime-300">Season centre</span>
          </div>
        </div>
      </section>

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Scheduled matches', count: matches.filter((match) => match.status === 'scheduled').length, icon: CalendarDays },
          { label: 'Results recorded', count: matches.filter((match) => match.status === 'completed').length, icon: Trophy },
          { label: 'Registered teams', count: teams.length, icon: UsersRound },
          { label: 'League updates', count: updates.length, icon: Newspaper },
        ].map(({ label, count, icon: Icon }) => (
          <div className="flex min-h-24 items-center gap-3 rounded-sm border border-slate-200 bg-white px-4 py-3" key={label}>
            <span className="grid size-9 shrink-0 place-items-center rounded-sm bg-sky-50 text-sky-800"><Icon size={17} /></span>
            <span><strong className="block font-display text-2xl font-bold leading-none text-slate-950">{count}</strong><span className="mt-1 block text-[10px] font-semibold text-slate-500">{label}</span></span>
          </div>
        ))}
      </div>

      {matchTableUrl && <section className={`${panelClass} mb-8 overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-sky-50 text-sky-800"><Trophy size={18} /></span>
            <div><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-sky-800">League standings</p><h2 className="font-display text-2xl font-bold text-slate-950">Match table</h2></div>
          </div>
          <span className="rounded-sm bg-lime-100 px-2.5 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-lime-900">Official table</span>
        </div>
        <div className="bg-slate-950 p-3 sm:p-5">
          <img className="mx-auto max-h-[75vh] w-full rounded-sm bg-white object-contain" src={matchTableUrl} alt={`${leagueName} match table`} />
        </div>
      </section>}

      {overviewScheduleUrl && <section className={`${panelClass} mb-8 overflow-hidden`}>
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4 sm:px-6">
          <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-sky-50 text-sky-800"><CalendarDays size={18} /></span>
          <div><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-sky-800">League schedule</p><h2 className="font-display text-2xl font-bold text-slate-950">Fixtures and results</h2></div>
        </div>
        <div className="bg-slate-950 p-3 sm:p-5">
          <img className="mx-auto max-h-[75vh] w-full rounded-sm bg-white object-contain" src={overviewScheduleUrl} alt={`${leagueName} match schedule and results`} />
        </div>
      </section>}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.85fr)]">
        <div className="space-y-5">
          <section className={`${panelClass} p-5 sm:p-6`}>
            <div className="mb-2 flex items-start justify-between gap-4">
              <div><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-sky-800">Next on the calendar</p><h2 className="mt-1 font-display text-2xl font-bold text-slate-950">Upcoming match</h2></div>
              <Link className="inline-flex items-center gap-1 pt-1 text-xs font-bold text-sky-800 hover:text-sky-950" to="/fixtures">All fixtures <ArrowRight size={14} /></Link>
            </div>
            {nextFixture ? <MatchListItem match={nextFixture} /> : <EmptyState icon={CalendarDays} title="No fixtures scheduled" description="The league has not published its next fixture yet." />}
          </section>

          <section className={`${panelClass} p-5 sm:p-6`}>
            <div className="mb-2 flex items-start justify-between gap-4">
              <div><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-sky-800">On the pitch</p><h2 className="mt-1 font-display text-2xl font-bold text-slate-950">Latest matches</h2></div>
              <Link className="inline-flex items-center gap-1 pt-1 text-xs font-bold text-sky-800 hover:text-sky-950" to="/matches">All matches <ArrowRight size={14} /></Link>
            </div>
            {latestMatches.length ? <div className="mt-2">{latestMatches.map((match) => <MatchListItem key={match.id} match={match} />)}</div> : <EmptyState icon={CircleHelp} title="No matches recorded" description="Published matches and results will appear here." />}
          </section>
        </div>

        <div className="space-y-5">
          <section className={`${panelClass} p-5 sm:p-6`}>
            <div className="mb-4 flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-sm bg-sky-50 text-sky-800"><Newspaper size={17} /></span><div><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-sky-800">League office</p><h2 className="mt-0.5 font-display text-2xl font-bold text-slate-950">Latest updates</h2></div></div>
            {latestUpdates.length ? <div className="space-y-3">{latestUpdates.map((update) => <article className="rounded-sm border border-slate-200 border-l-4 border-l-lime-400 bg-slate-50/70 p-4" key={update.id}><p className="text-[10px] font-bold uppercase tracking-wide text-sky-800">{new Date(update.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p><h3 className="mt-1.5 text-sm font-extrabold leading-5 text-slate-950">{update.title}</h3><p className="mt-2 whitespace-pre-line text-xs leading-5 text-slate-600">{update.body}</p></article>)}</div> : <EmptyState icon={Newspaper} title="No updates yet" description="League announcements will appear here when published." />}
          </section>

          <section className={`${panelClass} p-5 sm:p-6`}>
            <div className="mb-2 flex items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-sky-800">League directory</p><h2 className="mt-1 font-display text-2xl font-bold text-slate-950">Teams</h2></div><span className="grid size-9 place-items-center rounded-sm bg-sky-50 text-sky-800"><UsersRound size={17} /></span></div>
            {teams.length ? <ul className="mt-4 divide-y divide-slate-100">{teams.map((team) => <li className="flex items-center gap-3 py-3 first:pt-1" key={team.id}><span className="min-w-0 flex-1"><TeamIdentity teamName={team.teamName} logoUrl={team.logoUrl} logoClassName="size-10" fallbackIcon={UsersRound} nameClassName="text-sm font-bold text-slate-900" /><span className="mt-1 block text-xs text-slate-500">{team.division || 'Division pending'}</span></span></li>)}</ul> : <EmptyState icon={UsersRound} title="No teams registered" description="Approved teams will be listed here." to="/register" actionLabel="Register a team" />}
          </section>
        </div>
      </div>
    </>
  )
}
