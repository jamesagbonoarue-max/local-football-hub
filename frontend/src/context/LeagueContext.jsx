import { useEffect, useState } from 'react'
import { LeagueContext } from './leagueContext.js'
import { apiRequest } from './authApi.js'

const emptyLeague = {
  leagueName: 'Big Boyz FC',
  matchTableUrl: '',
  overviewMatchesUrl: '',
  overviewResultsUrl: '',
  matches: [],
  updates: [],
  teams: [],
  registrations: [],
}

export function LeagueProvider({ children }) {
  const [league, setLeague] = useState(() => ({ ...emptyLeague }))

  useEffect(() => {
    let active = true
    let inFlight = false
    let refreshTimer
    const refreshPublicLeagueData = async () => {
      if (!active || document.visibilityState !== 'visible' || inFlight) return
      inFlight = true
      try {
        const [matchResult, teamResult, updateResult, settingsResult] = await Promise.all([
          apiRequest('/api/matches', { token: '' }),
          apiRequest('/api/teams', { token: '' }),
          apiRequest('/api/updates', { token: '' }),
          apiRequest('/api/league-settings', { token: '' }),
        ])
        if (active) setLeague((current) => ({
          ...current,
          leagueName: settingsResult.leagueName,
          matchTableUrl: settingsResult.matchTableUrl,
          overviewMatchesUrl: settingsResult.overviewMatchesUrl || settingsResult.overviewScheduleUrl || '',
          overviewResultsUrl: settingsResult.overviewResultsUrl || '',
          matches: matchResult.matches,
          teams: teamResult.teams,
          updates: updateResult.updates,
        }))
      } catch {
        return
      } finally {
        inFlight = false
        if (active && document.visibilityState === 'visible') {
          refreshTimer = window.setTimeout(refreshPublicLeagueData, 30000)
        }
      }
    }
    const handleVisibilityChange = () => {
      window.clearTimeout(refreshTimer)
      if (document.visibilityState === 'visible') refreshPublicLeagueData()
    }
    refreshPublicLeagueData()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      active = false
      window.clearTimeout(refreshTimer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const value = {
    ...league,
    setLeagueName: async (name) => {
      const result = await apiRequest('/api/admin/league-settings', { method: 'PUT', body: { leagueName: name } })
      setLeague((current) => ({ ...current, leagueName: result.leagueName }))
      return result.leagueName
    },
    uploadMatchTable: async (formData) => {
      const result = await apiRequest('/api/admin/match-table', { method: 'POST', body: formData })
      setLeague((current) => ({ ...current, matchTableUrl: result.matchTableUrl }))
      return result
    },
    removeMatchTable: async () => {
      const result = await apiRequest('/api/admin/match-table', { method: 'DELETE' })
      setLeague((current) => ({ ...current, matchTableUrl: result.matchTableUrl }))
      return result
    },
    uploadOverviewImage: async (type, formData) => {
      if (!['matches', 'results'].includes(type)) throw new Error('Choose matches or results for the overview image.')
      const result = await apiRequest(`/api/admin/overview-images/${type}`, { method: 'POST', body: formData })
      const field = type === 'matches' ? 'overviewMatchesUrl' : 'overviewResultsUrl'
      setLeague((current) => ({ ...current, [field]: result[field] }))
      return result
    },
    removeOverviewImage: async (type) => {
      if (!['matches', 'results'].includes(type)) throw new Error('Choose matches or results for the overview image.')
      const result = await apiRequest(`/api/admin/overview-images/${type}`, { method: 'DELETE' })
      const field = type === 'matches' ? 'overviewMatchesUrl' : 'overviewResultsUrl'
      setLeague((current) => ({ ...current, [field]: result[field] }))
      return result
    },
    addMatch: async (match) => {
      const result = await apiRequest('/api/admin/matches', { method: 'POST', body: match })
      setLeague((current) => ({ ...current, matches: [result.match, ...current.matches] }))
      return result.match
    },
    removeMatch: async (id) => {
      await apiRequest(`/api/admin/matches/${encodeURIComponent(id)}`, { method: 'DELETE' })
      setLeague((current) => ({ ...current, matches: current.matches.filter((match) => match.id !== id) }))
    },
    updateMatch: async (id, match) => {
      const result = await apiRequest(`/api/admin/matches/${encodeURIComponent(id)}`, { method: 'PUT', body: match })
      setLeague((current) => ({ ...current, matches: current.matches.map((item) => item.id === id ? result.match : item) }))
      return result.match
    },
    addUpdate: async (update) => {
      const result = await apiRequest('/api/admin/updates', { method: 'POST', body: update })
      setLeague((current) => ({ ...current, updates: [result.update, ...current.updates] }))
      return result.update
    },
    removeUpdate: async (id) => {
      await apiRequest(`/api/admin/updates/${encodeURIComponent(id)}`, { method: 'DELETE' })
      setLeague((current) => ({ ...current, updates: current.updates.filter((update) => update.id !== id) }))
    },
    registerTeam: async (team) => apiRequest('/api/registrations', { method: 'POST', body: team, token: '' }),
    updateRegistration: async (id, registration) => {
      const result = await apiRequest(`/api/admin/registrations/${encodeURIComponent(id)}`, { method: 'PUT', body: registration })
      return result.registration
    },
    approveRegistration: async (id) => {
      const result = await apiRequest(`/api/admin/registrations/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { status: 'approved' } })
      const teamResult = await apiRequest('/api/teams', { token: '' })
      setLeague((current) => ({ ...current, teams: teamResult.teams }))
      return result.registration
    },
    removeRegistration: async (id) => apiRequest(`/api/admin/registrations/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { status: 'rejected' } }),
    removeTeam: async (id) => {
      await apiRequest(`/api/admin/registrations/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { status: 'rejected' } })
      const teamResult = await apiRequest('/api/teams', { token: '' })
      setLeague((current) => ({ ...current, teams: teamResult.teams }))
    },
  }

  return <LeagueContext.Provider value={value}>{children}</LeagueContext.Provider>
}
