/**
 * Shared constants for the Agent Office app.
 * Centralised to avoid duplication across Dashboard, Detail, and other views.
 */

export const COLORS = {
  satanmorroc: 'crimson',
  baphomet: 'amber',
  darklord: 'violet',
  amonra: 'pink',
  thanatos: 'purple',
  kafra: 'gold',
  valkyrie: 'blue',
  osiris: 'teal',
  doppelganger: 'indigo',
  eddga: 'orange',
  samurai: 'crimson',
  turtle: 'forest',
  evilsnakelord: 'emerald',
  lordofdeath: 'slate',
  atroce: 'rose',
}

export const RARITY = {
  satanmorroc: { tier: 'UR', stars: 6 },
  kafra: { tier: 'UR', stars: 6 },
  valkyrie: { tier: 'SSR', stars: 5 },
  thanatos: { tier: 'SSR', stars: 5 },
  evilsnakelord: { tier: 'SSR', stars: 5 },
  kield01: { tier: 'SR', stars: 4 },
  baphomet: { tier: 'SR', stars: 4 },
  lordofdeath: { tier: 'SR', stars: 4 },
  atroce: { tier: 'SR', stars: 4 },
  doppelganger: { tier: 'SR', stars: 4 },
  darklord: { tier: 'SR', stars: 4 },
  osiris: { tier: 'SR', stars: 4 },
  eddga: { tier: 'SR', stars: 4 },
  samurai: { tier: 'SR', stars: 4 },
  turtle: { tier: 'SR', stars: 4 },
  amonra: { tier: 'SR', stars: 4 },
}

export const STATUS_LABEL = {
  working: 'ACTIVE',
  thinking: 'THINKING',
  idle: 'IDLE',
  combat: 'ON TASK',
}

export const RELATION_GRAD = {
  amber: 'linear-gradient(155deg, #ffb84d, #ff5e8a)',
  violet: 'linear-gradient(155deg, #a350ff, #6e4ed8)',
  pink: 'linear-gradient(155deg, #ff5e9c, #d04080)',
  teal: 'linear-gradient(155deg, #4ee0c0, #3aa896)',
  purple: 'linear-gradient(155deg, #c850ff, #8348e0)',
  blue: 'linear-gradient(155deg, #5ec8ff, #4a90d8)',
  crimson: 'linear-gradient(155deg, #ff4d6e, #c8264a)',
  gold: 'linear-gradient(155deg, #ffd66a, #d49a30)',
  indigo: 'linear-gradient(155deg, #8a6cff, #5238b8)',
  orange: 'linear-gradient(155deg, #ff9a3a, #d4641a)',
  forest: 'linear-gradient(155deg, #5cd47a, #2d8a3e)',
  emerald: 'linear-gradient(155deg, #34d399, #059669)',
  slate: 'linear-gradient(155deg, #94a3b8, #475569)',
  rose: 'linear-gradient(155deg, #fb7185, #be123c)',
}

export function initials(name) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export function StarRow({ n }) {
  const filled = Math.max(0, n)
  const empty = Math.max(0, 5 - n)
  return (
    <span className="stars">
      {'★'.repeat(filled)}
      {'☆'.repeat(empty)}
    </span>
  )
}
