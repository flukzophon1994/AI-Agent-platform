/**
 * Agent UUIDs — fetched from Paperclip API
 * Company: 39e68b6f-0d66-4033-9899-e6b94474bcfe
 * 
 * These IDs are stable and can be used to reference agents
 * in API calls, routing, and cross-feature lookups.
 * 
 * Fetched: 2026-04-28
 */

const AGENT_UUIDS = {
  kafra:         '663dabab-a96b-4b03-9a8c-faa6b3f83210',
  satanmorroc:   'd085d46d-87fe-4bfe-810f-c5f0399e237c',
  thanatos:      'dde25386-f936-45b4-b009-da34b59b5e57',
  valkyrie:      '1d3fa21c-ed1c-42ab-87ad-4ce81985c402',
  baphomet:      '6cb0a6dd-2543-4454-8129-3decfde0a227',
  amonra:        '40fbce93-ebaa-4772-9ac8-8f898e0a284d',
  doppelganger:  'a76584b0-382b-45c2-a378-02679cfed2f6',
  osiris:        '146a01fe-1728-49b7-9846-5b5484623d6f',
  darklord:      'cdc4f90c-b284-4348-9504-fc1c077d4efc',
  eddga:         'eab0143f-deee-40c8-ba28-79c3fed1cc75',
  samurai:       '1db8f270-fd00-4af7-a740-5eec81dbf021',
  turtle:        'd36259ad-391c-4ce2-9b3e-7bcc0950e844',
  kield01:       'ea1b891d-e2ec-4759-a617-2d9b160e8c0d',
}

/** URL keys as defined in Paperclip (slug-style identifiers) */
const AGENT_URL_KEYS = {
  kafra:         'kafra',
  satanmorroc:   'satan-morroc',
  thanatos:      'thanatos-coo',
  valkyrie:      'valkyrie-cro',
  baphomet:      'baphomet-engineer',
  amonra:        'amon-ra-finance',
  doppelganger:  'doppelganger-sales',
  osiris:        'osiris-researcher',
  darklord:      'dark-lord-clientsuccess',
  eddga:         'eddga-marketing',
  samurai:       'samurai-specter-ops',
  turtle:        'turtle-general-admin',
  kield01:       'kiel-d-01-ui-ux-designer',
}

/** Full API display names (with role suffixes) */
const AGENT_API_NAMES = {
  kafra:         'Kafra',
  satanmorroc:   'Satan Morroc',
  thanatos:      'Thanatos (COO)',
  valkyrie:      'Valkyrie (CRO)',
  baphomet:      'Baphomet (Engineer)',
  amonra:        'Amon RA (Finance)',
  doppelganger:  'Doppelganger (Sales)',
  osiris:        'Osiris (Researcher)',
  darklord:      'Dark lord (ClientSuccess)',
  eddga:         'Eddga (Marketing)',
  samurai:       'Samurai Specter (Ops)',
  turtle:        'Turtle general (Admin)',
  kield01:       'Kiel D-01 (UI/UX designer)',
}

/**
 * Get the Paperclip UUID for a local agent ID.
 * @param {string} agentId — local agent id (e.g. 'kafra', 'satanmorroc')
 * @returns {string} UUID or empty string
 */
export function getAgentUuid(agentId) {
  return AGENT_UUIDS[agentId] || ''
}

/**
 * Get the Paperclip URL key for a local agent ID.
 * @param {string} agentId — local agent id
 * @returns {string} urlKey or empty string
 */
export function getAgentUrlKey(agentId) {
  return AGENT_URL_KEYS[agentId] || ''
}

/**
 * Look up local agent ID from a Paperclip UUID.
 * @param {string} uuid — Paperclip agent UUID
 * @returns {string} local agent id or empty string
 */
export function getLocalIdByUuid(uuid) {
  for (const [localId, id] of Object.entries(AGENT_UUIDS)) {
    if (id === uuid) return localId
  }
  return ''
}

/**
 * Get all agent UUIDs as a flat object.
 * @returns {Record<string, string>}
 */
export function getAllAgentUuids() {
  return { ...AGENT_UUIDS }
}

export { AGENT_UUIDS, AGENT_URL_KEYS, AGENT_API_NAMES }
