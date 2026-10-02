import { CalendarDays, CircleHelp, MapPin, Pencil, Trash2, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { isUpcomingMatch } from '../utils/matchTime.js'

export function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-sky-800">{eyebrow}</p>
        <h1 className="font-display text-4xl font-bold leading-none text-slate-950 sm:text-5xl">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function EmptyState({ icon: Icon = CircleHelp, title, description, to, actionLabel }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center px-5 py-9 text-center">
      <span className="mb-4 grid size-11 place-items-center rounded-sm bg-sky-50 text-sky-800"><Icon size={21} /></span>
      <h3 className="font-display text-xl font-bold text-slate-900">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
      {to && actionLabel && <Link className="mt-4 inline-flex items-center rounded-sm bg-sky-800 px-4 py-2 text-xs font-bold text-white hover:bg-sky-900" to={to}>{actionLabel}</Link>}
    </div>
  )
}

export function MatchListItem({ match, onEdit, onPublishResult, onDelete }) {
  const date = match.date
    ? new Date(`${match.date}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : 'Date to be confirmed'
  const completed = match.status === 'completed'
  const upcoming = !completed && isUpcomingMatch(match)
  const statusLabel = completed ? 'Result' : upcoming ? 'Scheduled' : 'Awaiting result'
  const statusClass = completed ? 'bg-emerald-50 text-emerald-800' : upcoming ? 'bg-sky-50 text-sky-800' : 'bg-amber-50 text-amber-800'

  return (
    <article className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-slate-100 py-4 last:border-b-0">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="truncate text-sm font-bold text-slate-900">{match.homeTeam} <span className="font-medium text-slate-400">vs</span> {match.awayTeam}</h3>
          <span className={`rounded-sm px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${statusClass}`}>{statusLabel}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} />{date}{match.kickoff && `, ${match.kickoff}`}</span>
          {match.venue && <span className="inline-flex items-center gap-1.5"><MapPin size={13} />{match.venue}</span>}
        </div>
      </div>
      {completed && <strong className="font-display text-xl font-bold tabular-nums text-slate-900">{match.homeScore} - {match.awayScore}</strong>}
      {(onEdit || onDelete) && <div className="flex items-center gap-1">
        {onPublishResult && !completed && <button className="inline-flex min-h-9 items-center gap-1 rounded-sm px-2 text-[10px] font-extrabold text-emerald-800 hover:bg-emerald-50" type="button" onClick={onPublishResult}><Trophy size={14} />Publish result</button>}
        {onEdit && <button className="grid size-9 place-items-center rounded-sm text-slate-400 hover:bg-sky-50 hover:text-sky-800" type="button" aria-label={`Edit ${match.homeTeam} versus ${match.awayTeam}`} title="Edit match" onClick={onEdit}><Pencil size={15} /></button>}
        {onDelete && <button className="grid size-9 place-items-center rounded-sm text-slate-400 hover:bg-rose-50 hover:text-rose-700" type="button" aria-label={`Delete ${match.homeTeam} versus ${match.awayTeam}`} title="Delete match" onClick={onDelete}><Trash2 size={16} /></button>}
      </div>}
    </article>
  )
}

export const panelClass = 'rounded-sm border border-slate-200 bg-white'
export const fieldClass = 'mt-1 block w-full rounded-sm border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-700 focus:ring-2 focus:ring-sky-100'
export const labelClass = 'block text-xs font-bold text-slate-700'
