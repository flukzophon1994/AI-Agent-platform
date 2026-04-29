/**
 * Agent Instructions — loaded from local AGENTS.md files.
 *
 * Each agent has its own folder under src/instructions/{agentId}/AGENTS.md.
 * Files are imported at build time via Vite's ?raw suffix.
 *
 * To update an agent's instructions:
 *   1. Edit the AGENTS.md file in src/instructions/{agentId}/
 *   2. Rebuild / hot-reload will pick up changes automatically
 */

import kafraMd          from './instructions/kafra/AGENTS.md?raw'
import satanmorrocMd    from './instructions/satanmorroc/AGENTS.md?raw'
import thanatosMd       from './instructions/thanatos/AGENTS.md?raw'
import valkyrieMd       from './instructions/valkyrie/AGENTS.md?raw'
import baphometMd       from './instructions/baphomet/AGENTS.md?raw'
import amonraMd         from './instructions/amonra/AGENTS.md?raw'
import doppelgangerMd   from './instructions/doppelganger/AGENTS.md?raw'
import osirisMd         from './instructions/osiris/AGENTS.md?raw'
import darklordMd       from './instructions/darklord/AGENTS.md?raw'
import eddgaMd          from './instructions/eddga/AGENTS.md?raw'
import samuraiMd        from './instructions/samurai/AGENTS.md?raw'
import turtleMd        from './instructions/turtle/AGENTS.md?raw'
import kield01Md       from './instructions/kield01/AGENTS.md?raw'

export const INSTRUCTIONS = {
  kafra:         kafraMd,
  satanmorroc:   satanmorrocMd,
  thanatos:      thanatosMd,
  valkyrie:      valkyrieMd,
  baphomet:      baphometMd,
  amonra:        amonraMd,
  doppelganger:  doppelgangerMd,
  osiris:        osirisMd,
  darklord:      darklordMd,
  eddga:         eddgaMd,
  samurai:       samuraiMd,
  turtle:        turtleMd,
  kield01:       kield01Md,
}

/**
 * Get the raw markdown instructions for a given agent ID.
 * @param {string} agentId
 * @returns {string} markdown content or empty string
 */
export function getAgentInstructions(agentId) {
  return INSTRUCTIONS[agentId] || ''
}
