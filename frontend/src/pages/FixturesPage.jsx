import { CalendarDays } from 'lucide-react'
import { useLeague } from '../context/useLeague.js'
import { EmptyState, MatchListItem, PageHeading, panelClass } from '../components/ui.jsx'
import { isUpcomingMatch } from '../utils/matchTime.js'

export default function FixturesPage() {
  const { matches } = useLeague()
  const fixtures = [...matches]
    .filter((match) => match.status === 'scheduled' && isUpcomingMatch(match))
    .sort((left, right) => left.date.localeCompare(right.date))

  return (
    <>
      <PageHeading eyebrow="League centre" title="Fixtures" description="The published schedule for upcoming league matches." />
      <section className={`${panelClass} px-5 sm:px-6`} aria-label="Upcoming fixtures">
        {fixtures.length ? fixtures.map((match) => <MatchListItem key={match.id} match={match} />) : <EmptyState icon={CalendarDays} title="No fixtures published" description="There are no upcoming fixtures yet. Check back when the league schedule is added." />}
      </section>
    </>
  )
}
