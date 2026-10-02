import { useContext } from 'react'
import { LeagueContext } from './leagueContext.js'

export function useLeague() {
  const league = useContext(LeagueContext)
  if (!league) throw new Error('useLeague must be used inside LeagueProvider')
  return league
}
