/**
 * Agent Service — Paperclip API integration layer.
 *
 * Endpoints:
 *   GET /api/companies/{companyId}/agents
 *   GET /api/companies/{companyId}/agents/{agentId}
 *
 * Falls back to local mock data (AGENTS) if API is unreachable or CORS-blocked.
 */

import { AGENTS } from '../agents'
import { getAgentApiKey } from './agentKeys'

// ─── Config ──────────────────────────────────────────────────────────────────
const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://paperclip-yom5.srv1508704.hstgr.cloud',
  apiKey: import.meta.env.VITE_API_KEY || 'pcp_1b41d008653047aebca8c34d787208527879c76511a34e69',
  companyId: import.meta.env.VITE_COMPANY_ID || '39e68b6f-0d66-4033-9899-e6b94474bcfe',
  pollInterval: import.meta.env.VITE_POLL_INTERVAL ? Number(import.meta.env.VITE_POLL_INTERVAL) : 30000,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function authHeaders(agentId) {
  const key = agentId ? getAgentApiKey(agentId, API_CONFIG.apiKey) : API_CONFIG.apiKey
  return {
    'Content-Type': 'application/json',
    ...(key ? { Authorization: `Bearer ${key}` } : {}),
  }
}

async function apiFetch(path, options = {}, agentId = '') {
  const url = `${API_CONFIG.baseUrl}${path}`
  const res = await fetch(url, {
    headers: authHeaders(agentId),
    ...options,
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`)
  return res.json()
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch full agent list from Paperclip using the global key.
 * Falls back to local mock data if API is not configured or unreachable.
 */
export async function fetchAgents() {
  try {
    const data = await apiFetch(`/api/companies/${API_CONFIG.companyId}/agents`)
    // Normalize API response into our app shape if needed
    return data || AGENTS
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[agentService] fetchAgents failed, using mock data:', err.message)
    return AGENTS
  }
}

/**
 * Fetch each agent individually using its own per-agent API key.
 * Returns an array of merged agent objects (local shape + API data).
 * Failed fetches fall back to local data for that agent.
 */
export async function fetchAgentsIndividual() {
  const results = await Promise.all(
    AGENTS.map(async (local) => {
      try {
        if (!local.apiData?.uuid) return local
        const api = await apiFetch(
          `/api/companies/${API_CONFIG.companyId}/agents/${local.apiData.uuid}`,
          {},
          local.id
        )
        return {
          ...local,
          status: api.status || local.status,
          task: api.capabilities ? api.capabilities.slice(0, 160) + (api.capabilities.length > 160 ? '…' : '') : local.task,
          apiData: { ...local.apiData, ...api },
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(`[agentService] fetch agent ${local.id} failed:`, err.message)
        return local
      }
    })
  )
  return results
}

/**
 * Fetch single agent details by ID (using our local ID mapping).
 * Falls back to local mock data.
 */
export async function fetchAgentStatus(agentId) {
  try {
    // Find the agent in local data first to get the API UUID
    const local = AGENTS.find((a) => a.id === agentId)
    if (!local?.apiData?.uuid) throw new Error('No API UUID mapped for this agent')

    const data = await apiFetch(`/api/companies/${API_CONFIG.companyId}/agents/${local.apiData.uuid}`, {}, agentId)
    return data
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[agentService] fetchAgentStatus failed, using mock data:', err.message)
    const agent = AGENTS.find((a) => a.id === agentId)
    return agent
      ? {
          id: agent.id,
          status: agent.status,
          task: agent.task,
          hp: agent.hp,
          mp: agent.mp,
          tokens: agent.tokens,
          series: agent.series,
        }
      : null
  }
}

/**
 * Fetch all active missions / tasks in the system.
 * (Paperclip does not expose this yet — returns empty array.)
 */
export async function fetchMissions() {
  try {
    // Placeholder: Paperclip API does not have a /missions endpoint yet
    return []
  } catch {
    return []
  }
}

/**
 * Fetch the activity feed / event log.
 * (Paperclip does not expose this yet — returns empty array.)
 */
export async function fetchActivityFeed(limit = 20) {
  try {
    // Placeholder
    return []
  } catch {
    return []
  }
}

/**
 * Send a command / message to an agent.
 * (Paperclip messaging endpoint TBD.)
 */
export async function sendAgentMessage(agentId, body) {
  const local = AGENTS.find((a) => a.id === agentId)
  if (!local?.apiData?.uuid) throw new Error('No API UUID mapped for this agent')

  return apiFetch(`/api/companies/${API_CONFIG.companyId}/agents/${local.apiData.uuid}/message`, {
    method: 'POST',
    body: JSON.stringify(body),
  }, agentId)
}

/**
 * Fetch issues list from Paperclip.
 * Falls back to empty array if API is unreachable.
 */
export async function fetchIssues() {
  try {
    const data = await apiFetch(`/api/companies/${API_CONFIG.companyId}/issues`)
    return Array.isArray(data) ? data : []
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[agentService] fetchIssues failed:', err.message)
    return []
  }
}

/**
 * Fetch a single agent by its Paperclip UUID.
 * Uses the company-scoped endpoint for CORS compatibility.
 * @param {string} uuid — Paperclip agent UUID
 * @param {string} localId — local agent id for key lookup
 * @returns {object} API agent data
 */
export async function fetchAgentByUuid(uuid, localId) {
  const data = await apiFetch(`/api/companies/${API_CONFIG.companyId}/agents/${uuid}`, {}, localId)
  return data
}

// ─── Polling hook helper ──────────────────────────────────────────────────────
/**
 * Returns { interval, clear } for polling a function every N ms.
 * Usage:
 *   const poller = startPolling(() => fetchAgents().then(setAgents))
 *   // later:
 *   poller.clear()
 */
export function startPolling(fn, interval = API_CONFIG.pollInterval) {
  fn() // run immediately
  const id = setInterval(fn, interval)
  return { interval: id, clear: () => clearInterval(id) }
}

export { API_CONFIG }
