/**
 * Agent-specific API Key Manager
 *
 * Provides per-agent API key overrides that persist in localStorage.
 * Falls back to built-in default keys per agent, then to the global VITE_API_KEY.
 */

const STORAGE_KEY = 'hermoso_agent_api_keys'

// Default API keys for each agent (assigned 2026-04-28)
const DEFAULT_AGENT_KEYS = {
  kafra:       'pcp_f6af87a3c28fdbbbb4200ae38a6a69d4bfcb50e837aa3d20',
  satanmorroc: 'pcp_4b51a8d591ad50605b76cdded4009316c01f554a3ab65db5',
  thanatos:    'pcp_2d6bf8784f8b93be5cc05de98dc43f4e56a750e3fe4da9a9',
  valkyrie:    'pcp_c0ecff5b5a124551887da67cc9066c7c84604557dbc768ec',
  amonra:      'pcp_0c26765f1b70b895822c2e39c4dcf8e781a2f840092f7da7',
  baphomet:    'pcp_5e15ab221901569b146407fb15e03a9b3bfcfa7fa6cd8674',
  samurai:     'pcp_a1eec51a392c92a563ed8bdf817115f76e604c723b5bf766',
  turtle:      'pcp_118478c4270f5f566f3024e1a9f29961d2f99710f52bb311',
  darklord:    'pcp_a9b49ba55c35d2c9848a04caadc8203756f2b455bf52bb31',
  doppelganger:'pcp_bfc5355938584b12df2ae235cc3f5212317b483a411e3f30',
  eddga:       'pcp_8325c19881b608367e7c07311a1a2b7e8f72b84ebaecce0a',
  osiris:      'pcp_ba96c964b9c27f025e2ba4da4733eaf8db4c9d16480ef6d8',
  kield01:     'pcp_5103d7d854800011503daaeab6bef67eb073d8e5281e6e06',
  evilsnakelord: 'pcp_fdb734dcfacd1befe5a117f490cdf494d31b6d60120b1897',
  lordofdeath:   'pcp_9f14899630a893ce00c9fba8ea4ad11fdb98fbe70f0e64f7',
  atroce:        'pcp_1a55dbecbe94fa33764ff30cc90489b92dfd6ab2fe8c7aba',
}

/** @returns {Record<string, string>} */
function loadMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveMap(map) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

/**
 * Get the API key for a specific agent.
 * Priority: localStorage override > built-in default > global fallbackKey
 */
export function getAgentApiKey(agentId, fallbackKey = '') {
  const map = loadMap()
  if (map[agentId]) return map[agentId]
  if (DEFAULT_AGENT_KEYS[agentId]) return DEFAULT_AGENT_KEYS[agentId]
  return fallbackKey
}

/**
 * Get the built-in default key for an agent (read-only).
 */
export function getDefaultAgentKey(agentId) {
  return DEFAULT_AGENT_KEYS[agentId] || ''
}

/**
 * Set (or override) the API key for a specific agent.
 * Passing an empty string removes the override so the default key is used.
 */
export function setAgentApiKey(agentId, key) {
  const map = loadMap()
  if (!key || key.trim() === '') {
    delete map[agentId]
  } else {
    map[agentId] = key.trim()
  }
  saveMap(map)
}

/**
 * Remove the per-agent API key override for an agent.
 * After removal, the built-in default key will be used.
 */
export function removeAgentApiKey(agentId) {
  const map = loadMap()
  delete map[agentId]
  saveMap(map)
}

/**
 * Check whether a given agent has a localStorage override.
 */
export function hasCustomApiKey(agentId) {
  const map = loadMap()
  return !!map[agentId]
}

/**
 * Check whether this agent has any key available (override or default).
 */
export function hasAgentKey(agentId) {
  return !!(loadMap()[agentId] || DEFAULT_AGENT_KEYS[agentId])
}

/**
 * List all agent IDs that have custom localStorage overrides.
 */
export function listCustomAgentKeys() {
  return Object.keys(loadMap())
}

/**
 * List all agent IDs that have default keys defined.
 */
export function listDefaultAgentKeys() {
  return Object.keys(DEFAULT_AGENT_KEYS)
}
