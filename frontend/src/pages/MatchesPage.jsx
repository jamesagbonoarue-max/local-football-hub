import { useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { useLeague } from '../context/useLeague.js'
import { EmptyState, MatchListItem, PageHeading, panelClass } from '../components/ui.jsx'

const filters = [
  { label: 'All matches', value: 'all' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Results', value: 'completed' },
]

export default function MatchesPage() {
  const { matches } = useLeague()
  const [filter, setFilter] = useState('all')
  const visibleMatches = [...matches]
    .filter((match) => filter === 'all' || match.status === filter)
    .sort((left, right) => left.date.localeCompare(right.date))

  return (
    <>
      <PageHeading eyebrow="League centre" title="Matches" description="Scheduled league matches and recorded results." />
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter matches">
        {filters.map((item) => <button className={`rounded-sm px-3 py-2 text-xs font-bold ${filter === item.value ? 'bg-slate-900 text-white' : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'}`} type="button" aria-pressed={filter === item.value} onClick={() => setFilter(item.value)} key={item.value}>{item.label}</button>)}
      </div>
      <section className={`${panelClass} px-5 sm:px-6`} aria-label="League matches">
        {visibleMatches.length ? visibleMatches.map((match) => <MatchListItem key={match.id} match={match} />) : <EmptyState icon={ClipboardList} title={matches.length ? 'No matches in this view' : 'No matches yet'} description={matches.length ? 'Try another filter to see the league schedule.' : 'Matches added by the league administrator will appear here.'} />}
      </section>
    </>
  )
}
