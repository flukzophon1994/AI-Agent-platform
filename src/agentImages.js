/**
 * Agent portrait images — mapped from src/imageAgents/
 * Uses Vite's import.meta.url for proper asset handling.
 */

const AGENT_IMAGES = {
  kafra:       new URL('./imageAgents/Kafra.png', import.meta.url).href,
  satanmorroc: new URL('./imageAgents/Satan Morroc.png', import.meta.url).href,
  thanatos:    new URL('./imageAgents/Thanatos.png', import.meta.url).href,
  valkyrie:    new URL('./imageAgents/Valkyrie.png', import.meta.url).href,
  amonra:      new URL('./imageAgents/Amon RA.png', import.meta.url).href,
  baphomet:    new URL('./imageAgents/Baphomet.png', import.meta.url).href,
  samurai:     new URL('./imageAgents/Samurai Specter.png', import.meta.url).href,
  turtle:      new URL('./imageAgents/Turtle General.png', import.meta.url).href,
  darklord:    new URL('./imageAgents/Darklord.png', import.meta.url).href,
  doppelganger:new URL('./imageAgents/Doppelganger.png', import.meta.url).href,
  eddga:       new URL('./imageAgents/Eddga.png', import.meta.url).href,
  osiris:      new URL('./imageAgents/Osiris.png', import.meta.url).href,
  kield01:     new URL('./imageAgents/Kiel D-01.png', import.meta.url).href,
}

export function getAgentImage(agentId) {
  return AGENT_IMAGES[agentId] || ''
}
