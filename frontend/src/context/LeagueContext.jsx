import { useEffect, useState } from 'react'
import { LeagueContext } from './leagueContext.js'
import { apiRequest } from './authApi.js'

const STORAGE_KEY = 'local-football-league-data'
const emptyLeague = {
  leagueName: 'Local Football League',
  matches: [],
  updates: [],
  teams: [],
  registrations: [],
}

function readLeague() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY))
    if (!saved || typeof saved !== 'object') return emptyLeague
    return {
      ...emptyLeague,
      ...saved,
      matches: [],
      updates: [],
      teams: [],
      registrations: [],
    }
  } catch {
    return emptyLeague
  }
}

export function LeagueProvider({ children }) {
  const [league, setLeague] = useState(readLeague)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ leagueName: league.leagueName }))
  }, [league])

  useEffect(() => {
    let active = true
    const refreshPublicLeagueData = () => {
      Promise.all([
        apiRequest('/api/matches', { token: '' }),
        apiRequest('/api/teams', { token: '' }),
        apiRequest('/api/updates', { token: '' }),
      ])
        .then(([matchResult, teamResult, updateResult]) => {
          if (active) setLeague((current) => ({ ...current, matches: matchResult.matches, teams: teamResult.teams, updates: updateResult.updates }))
        })
        .catch(() => {})
    }
    refreshPublicLeagueData()
    const refreshInterval = window.setInterval(refreshPublicLeagueData, 15000)
    return () => {
      active = false
      window.clearInterval(refreshInterval)
    }
  }, [])

  useEffect(() => {
    const syncFromOtherTab = (event) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return
      try {
        const saved = JSON.parse(event.newValue)
        setLeague((current) => ({
          ...current,
          leagueName: saved.leagueName || emptyLeague.leagueName,
          updates: Array.isArray(saved.updates) ? saved.updates : [],
        }))
      } catch {
        setLeague(emptyLeague)
      }
    }
    window.addEventListener('storage', syncFromOtherTab)
    return () => window.removeEventListener('storage', syncFromOtherTab)
  }, [])

  const value = {
    ...league,
    setLeagueName: (name) => setLeague((current) => ({ ...current, leagueName: name.trim() || emptyLeague.leagueName })),
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
