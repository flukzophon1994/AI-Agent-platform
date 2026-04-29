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
  baseUrl: import.meta.env.DEV
    ? ''
    : (import.meta.env.VITE_API_BASE_URL || 'https://paperclip-yom5.srv1508704.hstgr.cloud'),
  apiKey: import.meta.env.VITE_API_KEY || 'pcp_c4efebee09b45a3119c95375af0c0f3130221ea259d08256',
  companyId: import.meta.env.VITE_COMPANY_ID || '39e68b6f-0d66-4033-9899-e6b94474bcfe',
  pollInterval: import.meta.env.VITE_POLL_INTERVAL ? Number(import.meta.env.VITE_POLL_INTERVAL) : 3000,
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
 * Fetch all agents from the company list endpoint, then merge with local data.
 * Falls back to local data if the list endpoint fails or an agent is not found.
 */
export async function fetchAgentsIndividual() {
  let apiList = []
  try {
    const data = await apiFetch(`/api/companies/${API_CONFIG.companyId}/agents`)
    apiList = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : [])
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[agentService] fetchAgents list failed:', err.message)
    return AGENTS
  }

  // Build lookup by UUID for fast merging
  const byUuid = new Map()
  apiList.forEach((agent) => {
    if (agent.id) byUuid.set(agent.id, agent)
  })

  return AGENTS.map((local) => {
    const api = byUuid.get(local.apiData?.uuid)
    if (!api) return local
    const apiStatus = api.status ?? api.state ?? local.status
    return {
      ...local,
      status: apiStatus,
      task: api.capabilities
        ? api.capabilities.slice(0, 160) + (api.capabilities.length > 160 ? '…' : '')
        : local.task,
      apiData: { ...local.apiData, ...api },
    }
  })
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
 * Fetch dashboard summary stats from Paperclip.
 * GET /api/companies/{companyId}/dashboard
 * Returns array with agents, tasks, costs, pendingApprovals, budgets.
 */
export async function fetchDashboard() {
  try {
    const data = await apiFetch(`/api/companies/${API_CONFIG.companyId}/dashboard`)
    // API returns an array — take the first item
    if (Array.isArray(data) && data.length > 0) return data[0]
    return data || null
  } catch (err) {
    console.warn('[agentService] fetchDashboard failed:', err.message)
    return null
  }
}

/**
 * Fetch the activity feed / event log from Paperclip.
 * GET /api/companies/{companyId}/activity
 * Returns { value: ActivityItem[], Count: number }
 */
export async function fetchActivityFeed(limit = 100) {
  try {
    const data = await apiFetch(`/api/companies/${API_CONFIG.companyId}/activity`)
    const items = Array.isArray(data?.value) ? data.value : Array.isArray(data) ? data : []
    return limit > 0 ? items.slice(0, limit) : items
  } catch (err) {
    console.warn('[agentService] fetchActivityFeed failed:', err.message)
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
 * Fetch a single issue by ID with full details.
 * GET /api/issues/{issueId}
 */
export async function fetchIssueById(issueId) {
  try {
    const data = await apiFetch(`/api/issues/${issueId}`)
    return data
  } catch (err) {
    console.warn('[agentService] fetchIssueById failed:', err.message)
    return null
  }
}

/**
 * Fetch comments for an issue — contains AI agent responses.
 * GET /api/issues/{issueId}/comments
 * Returns array of { id, body, authorAgentId, createdAt, ... }
 */
export async function fetchIssueComments(issueId) {
  try {
    const data = await apiFetch(`/api/issues/${issueId}/comments`)
    return Array.isArray(data) ? data : []
  } catch (err) {
    console.warn('[agentService] fetchIssueComments failed:', err.message)
    return []
  }
}

/**
 * Fetch documents attached to an issue — long-form AI outputs (plans, reports).
 * GET /api/issues/{issueId}/documents
 * Returns array of { id, key, title, format, body, ... }
 */
export async function fetchIssueDocuments(issueId) {
  try {
    const data = await apiFetch(`/api/issues/${issueId}/documents`)
    return Array.isArray(data) ? data : []
  } catch (err) {
    console.warn('[agentService] fetchIssueDocuments failed:', err.message)
    return []
  }
}

/**
 * Create a new issue via Paperclip API.
 * POST /api/companies/{companyId}/issues
 * @param {object} body — { title, description, assigneeAgentId, priority, status, projectId, goalId }
 * @returns {object} created issue
 */
export async function createIssue(body) {
  return apiFetch(`/api/companies/${API_CONFIG.companyId}/issues`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/**
 * Fetch projects list from Paperclip.
 * GET /api/companies/{companyId}/projects
 * Returns array of { id, name, color, status, goalId, ... }
 */
export async function fetchProjects() {
  try {
    const data = await apiFetch(`/api/companies/${API_CONFIG.companyId}/projects`)
    return Array.isArray(data) ? data : []
  } catch (err) {
    console.warn('[agentService] fetchProjects failed:', err.message)
    return []
  }
}

/**
 * Upload an attachment to an issue.
 * POST /api/companies/{companyId}/issues/{issueId}/attachments  (multipart/form-data)
 * @param {string} issueId — Paperclip issue UUID
 * @param {File} file — the file to upload
 * @returns {object} attachment metadata
 */
export async function uploadAttachment(issueId, file) {
  const formData = new FormData()
  formData.append('file', file)
  const url = `${API_CONFIG.baseUrl}/api/companies/${API_CONFIG.companyId}/issues/${issueId}/attachments`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_CONFIG.apiKey}`,
    },
    body: formData,
  })
  if (!res.ok) throw new Error(`Upload failed ${res.status}: ${await res.text()}`)
  return res.json()
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
