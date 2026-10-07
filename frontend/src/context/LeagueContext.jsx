import { useEffect, useState } from 'react'
import { LeagueContext } from './leagueContext.js'
import { apiRequest } from './authApi.js'

const emptyLeague = {
  leagueName: 'Big Boyz FC',
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
