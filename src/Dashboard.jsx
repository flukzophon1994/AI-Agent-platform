import { useState } from 'react'
import { COLORS, RARITY, STATUS_LABEL, initials, StarRow } from './constants.jsx'

/* ── Helpers ───────────────────────────────────────────────────────── */

function timeAgo(iso) {
  if (!iso) return 'never'
  const diff = Date.now() - new Date(iso).getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 5) return 'just now'
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.floor(hr / 24)}d ago`
}

function isOnline(agent) {
  const hb = agent.apiData?.lastHeartbeatAt
  if (!hb) return false
  const diff = Date.now() - new Date(hb).getTime()
  return diff < 5 * 60 * 1000 // 5 minutes
}

function adapterLabel(type) {
  if (!type) return '—'
  if (type === 'claude_local') return 'Claude'
  return type.replace('_', ' ')
}

function budgetPct(agent) {
  const spent = agent.apiData?.spentMonthlyCents || 0
  const budget = agent.apiData?.budgetMonthlyCents || 0
  if (!budget) return 0
  return Math.min(100, Math.round((spent / budget) * 100))
}

/* ── AgentCard ─────────────────────────────────────────────────────── */

function AgentCard({ agent, onOpen }) {
  const color = COLORS[agent.id] || 'violet'
  const rar = RARITY[agent.id] || { tier: 'SR', stars: 4 }
  const init = initials(agent.name)
  const online = isOnline(agent)
  const paused = !!agent.apiData?.pausedAt
  const heartbeat = agent.apiData?.lastHeartbeatAt
  const adapter = adapterLabel(agent.apiData?.adapterType)
  const pct = budgetPct(agent)

  return (
    <div className="agent-card" onClick={() => onOpen(agent.id)} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpen(agent.id) }}
      aria-label={`Open ${agent.name} profile`}>
      <div className={`card-grad ${color}`}>
        <div className="card-top">
          <div className="rarity">
            <span className="label">{rar.tier}</span>
            <StarRow n={rar.stars} />
          </div>
          <div className={`live-pip ${online ? 'on' : 'off'}`} title={online ? 'Online' : 'Offline'} />
        </div>

        <div className="card-status-row">
          <span className="status-pill">{STATUS_LABEL[agent.status] || agent.status.toUpperCase()}</span>
          <span className="lvl-pill">Lv {agent.level}</span>
        </div>

        <div className="card-mid">
          <div className="card-initials">{init}</div>
        </div>

        <div className="card-portrait-tag">
          {adapter} · {agent.platform}
        </div>
      </div>

      <div className="card-body">
        <h3>{agent.name}</h3>
        <div className="role">{agent.title}</div>

        <div className="card-meta-row">
          <span className={`hb ${online ? 'on' : ''}`}>
            {online ? '● ' : '○ '}
            {heartbeat ? timeAgo(heartbeat) : 'no heartbeat'}
          </span>
          {paused && <span className="paused">PAUSED</span>}
        </div>

        <div className="card-stats">
          <div className="card-stat">
            <div className="lbl">PWR</div>
            <div className="val">{((agent.level * 110) / 1000).toFixed(1)}k</div>
          </div>
          <div className="card-stat">
            <div className="lbl">TASK</div>
            <div className="val">{200 + agent.level * 4}</div>
          </div>
          <div className="card-stat">
            <div className="lbl">BUDGET</div>
            <div className={`val ${pct > 80 ? 'red' : pct > 50 ? 'orange' : 'green'}`}>{pct}%</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Mini stat tile ────────────────────────────────────────────────── */

function MiniTile({ label, value, sub, tone = '' }) {
  return (
    <div className={`stat-tile ${tone}`}>
      <div className="label">{label}</div>
      <div className={`value ${tone}`}>{value}</div>
      <div className="delta">{sub}</div>
    </div>
  )
}

/* ── MissionControl (Dashboard) ────────────────────────────────────── */

export default function MissionControl({ agents, onOpenAgent, loading, error, lastUpdated, onRefresh }) {
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all'
    ? agents
    : agents.filter((a) => RARITY[a.id]?.tier === filter.toUpperCase())

  const onlineCount = agents.filter(isOnline).length
  const pausedCount = agents.filter((a) => !!a.apiData?.pausedAt).length
  const ceoCount = agents.filter((a) => a.apiData?.role === 'ceo').length
  const totalBudget = agents.reduce((sum, a) => sum + (a.apiData?.budgetMonthlyCents || 0), 0)
  const totalSpent = agents.reduce((sum, a) => sum + (a.apiData?.spentMonthlyCents || 0), 0)

  return (
    <div className="main">
      {/* Header */}
      <div className="page-head">
        <div className="page-title">
          <h1><span className="accent">Agent</span> Roster</h1>
          <div className="meta">
            {agents.length} agents · synced with Paperclip
            {lastUpdated && (
              <span className="mono" style={{ marginLeft: 8, color: 'var(--text-muted)' }}>
                · updated {timeAgo(lastUpdated)}
              </span>
            )}
          </div>
        </div>
        <div className="page-actions">
          <span className="pill">
            <span className="dot" />
            {onlineCount} ONLINE
          </span>
          <button className="btn ghost" onClick={onRefresh} disabled={loading}>
            {loading ? '⟳ Syncing…' : '⟳ Refresh'}
          </button>
          <button className="btn primary">+ Summon</button>
        </div>
      </div>

      {/* Realtime status bar */}
      {error && (
        <div className="rt-banner err">
          <span>⚠ API sync failed: {error} · showing cached data</span>
        </div>
      )}
      {!error && lastUpdated && (
        <div className="rt-banner ok">
          <span>● Live · {timeAgo(lastUpdated)} · polling every 30s</span>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginBottom: 8 }}>
        <div className="chips">
          {['all', 'ur', 'ssr', 'sr'].map((c) => (
            <button key={c} className={`chip ${filter === c ? 'active' : ''}`} onClick={() => setFilter(c)}>
              {c.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="stat-row">
        <MiniTile label="Active Agents" value={agents.length} sub={`${onlineCount} online · ${pausedCount} paused`} />
        <MiniTile label="Budget Used" value={`$${(totalSpent / 100).toFixed(2)}`}
          sub={totalBudget ? `of $${(totalBudget / 100).toFixed(2)} · ${Math.round((totalSpent / totalBudget) * 100)}%` : 'no budget set'} tone="gold" />
        <MiniTile label="Adapters" value={new Set(agents.map((a) => a.apiData?.adapterType).filter(Boolean)).size}
          sub={`${ceoCount} orchestrator${ceoCount !== 1 ? 's' : ''}`} tone="green" />
        <MiniTile label="System Health" value={`${Math.round((onlineCount / Math.max(agents.length, 1)) * 100)}%`}
          sub={`${agents.length - onlineCount} offline · polling 30s`} tone={onlineCount === agents.length ? 'green' : 'red'} />
      </div>

      {/* Agent grid */}
      <div className="card-grid">
        {filtered.map((a) => (
          <AgentCard key={a.id} agent={a} onOpen={onOpenAgent} />
        ))}
      </div>

      {/* Capabilities summary */}
      <div className="section-head">
        <h2><span className="accent">Capability</span> Matrix</h2>
        <span className="meta">Real-time from Paperclip</span>
      </div>
      <div className="cap-grid">
        {agents.map((a) => (
          <div key={a.id} className="cap-card">
            <div className="cap-top">
              <span className="cap-name">{a.name}</span>
              <span className={`cap-status ${isOnline(a) ? 'on' : 'off'}`}>{isOnline(a) ? '●' : '○'}</span>
            </div>
            <div className="cap-body">{a.apiData?.capabilities || a.task || '—'}</div>
            <div className="cap-foot">
              <span className="mono">{adapterLabel(a.apiData?.adapterType)}</span>
              <span className="mono">{a.apiData?.budgetMonthlyCents ? `$${(a.apiData.budgetMonthlyCents / 100).toFixed(0)}/mo` : '—'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
