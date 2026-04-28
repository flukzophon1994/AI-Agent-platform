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

// ─── Config ──────────────────────────────────────────────────────────────────
const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://paperclip-yom5.srv1508704.hstgr.cloud',
  apiKey: import.meta.env.VITE_API_KEY || 'pcp_1b41d008653047aebca8c34d787208527879c76511a34e69',
  companyId: import.meta.env.VITE_COMPANY_ID || '39e68b6f-0d66-4033-9899-e6b94474bcfe',
  pollInterval: import.meta.env.VITE_POLL_INTERVAL ? Number(import.meta.env.VITE_POLL_INTERVAL) : 30000,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function authHeaders() {
  return {
    'Content-Type': 'application/json',
    ...(API_CONFIG.apiKey ? { Authorization: `Bearer ${API_CONFIG.apiKey}` } : {}),
  }
}

async function apiFetch(path, options = {}) {
  const url = `${API_CONFIG.baseUrl}${path}`
  const res = await fetch(url, {
    headers: authHeaders(),
    ...options,
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`)
  return res.json()
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch full agent list from Paperclip.
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
 * Fetch single agent details by ID (using our local ID mapping).
 * Falls back to local mock data.
 */
export async function fetchAgentStatus(agentId) {
  try {
    // Find the agent in local data first to get the API UUID
    const local = AGENTS.find((a) => a.id === agentId)
    if (!local?.apiData?.uuid) throw new Error('No API UUID mapped for this agent')

    const data = await apiFetch(`/api/companies/${API_CONFIG.companyId}/agents/${local.apiData.uuid}`)
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
  })
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
