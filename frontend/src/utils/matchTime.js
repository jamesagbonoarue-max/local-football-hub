export function isUpcomingMatch(match, now = new Date()) {
  if (!match.date || !match.kickoff) return false
  const startsAt = new Date(`${match.date}T${match.kickoff}:00`)
  return !Number.isNaN(startsAt.getTime()) && startsAt > now
}
