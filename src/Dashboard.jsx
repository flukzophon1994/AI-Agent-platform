import { useState, useEffect, useRef, useCallback } from 'react'
import { COLORS, RARITY, initials, StarRow } from './constants.jsx'
import { getAgentImage } from './agentImages'
import { fetchIssues } from './api/agentService'

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
  return diff < 5 * 60 * 1000
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

/* ── Mini sparkline (simple CSS bars) ──────────────────────────────── */

function Sparkline({ data, color = 'var(--green)', height = 48 }) {
  const max = Math.max(...data, 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height }}>
      {data.map((v, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: `${(v / max) * 100}%`,
            minHeight: 2,
            background: color,
            borderRadius: 1,
            opacity: 0.7 + (i / data.length) * 0.3,
          }}
        />
      ))}
    </div>
  )
}

/* ── Stat Tile (Paperclip style) ───────────────────────────────────── */

function StatTile({ label, value, sub, icon, tone = '', href = '#' }) {
  return (
    <a href={href} className="dash-stat-tile" onClick={(e) => e.preventDefault()}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className={`dash-stat-value ${tone}`}>{value}</p>
          <p className="dash-stat-label">{label}</p>
          {sub && <p className="dash-stat-sub">{sub}</p>}
        </div>
        <span className="dash-stat-icon" aria-hidden="true">{icon}</span>
      </div>
    </a>
  )
}

/* ── Chart Card ────────────────────────────────────────────────────── */

function ChartCard({ title, subtitle, children, legend }) {
  return (
    <div className="dash-chart-card">
      <div>
        <h3 className="dash-chart-title">{title}</h3>
        {subtitle && <span className="dash-chart-sub">{subtitle}</span>}
      </div>
      <div className="dash-chart-body">
        {children}
      </div>
      {legend && (
        <div className="dash-chart-legend">
          {legend.map((item, i) => (
            <span key={i} className="dash-chart-legend-item">
              <span className="dot" style={{ background: item.color }} />
              {item.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Activity Row ──────────────────────────────────────────────────── */

function ActivityRow({ avatar, name, action, target, time, href = '#' }) {
  return (
    <a href={href} className="dash-activity-row" onClick={(e) => e.preventDefault()}>
      <div className="flex gap-3 items-start">
        <span className="dash-activity-avatar">{avatar}</span>
        <p className="dash-activity-text flex-1 min-w-0">
          <span className="dash-activity-name">{name}</span>
          <span className="dash-activity-action"> {action} </span>
          <span className="dash-activity-target">{target}</span>
        </p>
        <span className="dash-activity-time">{time}</span>
      </div>
    </a>
  )
}

/* ── Issue Row ─────────────────────────────────────────────────────── */

function IssueRow({ status, code, title, assignee, time, href = '#' }) {
  const statusColors = {
    open: { border: 'var(--red)', bg: 'var(--red)', fill: false },
    closed: { border: 'var(--green)', bg: 'var(--green)', fill: true },
    done: { border: 'var(--green)', bg: 'var(--green)', fill: true },
    in_progress: { border: 'var(--accent)', bg: 'var(--accent)', fill: false },
    review: { border: 'var(--accent)', bg: 'var(--accent)', fill: false },
    blocked: { border: 'var(--red)', bg: 'var(--red)', fill: true },
  }
  const st = statusColors[status] || statusColors.open

  return (
    <a href={href} className="dash-task-row" onClick={(e) => e.preventDefault()}>
      <div className="flex items-start gap-2 sm:items-center sm:gap-3">
        <span className="shrink-0 sm:hidden">
          <span className="dash-task-status-dot" style={{ borderColor: st.border, background: st.fill ? st.bg : 'transparent' }} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1 sm:contents">
          <span className="dash-task-title sm:order-2 sm:flex-1 sm:min-w-0 sm:truncate">{title}</span>
          <span className="flex items-center gap-2 sm:order-1 sm:shrink-0">
            <span className="hidden sm:inline-flex">
              <span className="dash-task-status-dot" style={{ borderColor: st.border, background: st.fill ? st.bg : 'transparent' }} />
            </span>
            <span className="dash-task-code">{code}</span>
            {assignee && (
              <span className="hidden sm:inline-flex dash-task-assignee">
                <span className="dash-task-assignee-avatar">{initials(assignee)}</span>
                <span className="truncate">{assignee}</span>
              </span>
            )}
            <span className="dash-task-time sm:order-last">{time}</span>
          </span>
        </span>
      </div>
    </a>
  )
}

/* ── Quick Agent Mini Card (for dashboard overview) ───────────────── */

function MiniAgentCard({ agent, onOpen }) {
  const color = COLORS[agent.id] || 'violet'
  const rar = RARITY[agent.id] || { tier: 'SR', stars: 4 }
  const img = getAgentImage(agent.id)
  const online = isOnline(agent)

  return (
    <div
      className="mini-agent-card"
      onClick={() => onOpen(agent.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpen(agent.id) }}
      aria-label={`Open ${agent.name} profile`}
    >
      <div className={`mini-agent-grad ${color}`}>
        <div className="mini-agent-top">
          <div className="rarity">
            <span className="label">{rar.tier}</span>
            <StarRow n={rar.stars} />
          </div>
          <div className={`live-pip ${online ? 'on' : 'off'}`} />
        </div>
        <div className="mini-agent-mid">
          {img ? (
            <img src={img} alt={agent.name} className="mini-agent-portrait-img" />
          ) : (
            <div className="mini-agent-initials">{initials(agent.name)}</div>
          )}
        </div>
      </div>
      <div className="mini-agent-body">
        <h4>{agent.name}</h4>
        <div className="role">{agent.title}</div>
        <div className="mini-agent-meta">
          <span>Lv {agent.level}</span>
          <span>·</span>
          <span>{adapterLabel(agent.apiData?.adapterType)}</span>
        </div>
      </div>
    </div>
  )
}

/* ── Dashboard (Overview / Command Center) ─────────────────────────── */

export default function MissionControl({ agents, onOpenAgent, loading, error, lastUpdated, onRefresh }) {
  const [issues, setIssues] = useState([])
  const [issuesLoading, setIssuesLoading] = useState(false)
  const [issuesError, setIssuesError] = useState(null)
  const [issuesUpdated, setIssuesUpdated] = useState(null)
  const issuesTimerRef = useRef()

  const onlineCount = agents.filter(isOnline).length
  const pausedCount = agents.filter((a) => !!a.apiData?.pausedAt).length
  const workingCount = agents.filter((a) => a.status === 'working').length
  const totalBudget = agents.reduce((sum, a) => sum + (a.apiData?.budgetMonthlyCents || 0), 0)
  const totalSpent = agents.reduce((sum, a) => sum + (a.apiData?.spentMonthlyCents || 0), 0)

  // Fetch issues from Paperclip API
  const refreshIssues = useCallback(async () => {
    setIssuesLoading(true)
    try {
      const data = await fetchIssues()
      setIssues(data)
      setIssuesError(null)
      setIssuesUpdated(new Date().toISOString())
    } catch (err) {
      setIssuesError(err.message)
    } finally {
      setIssuesLoading(false)
    }
  }, [])

  // Poll issues every 3 seconds
  useEffect(() => {
    refreshIssues() // initial fetch
    issuesTimerRef.current = setInterval(refreshIssues, 3000)
    return () => clearInterval(issuesTimerRef.current)
  }, [refreshIssues])

  // Count issues by status
  const openIssues = issues.filter((i) => i.status === 'open' || !i.status).length
  const closedIssues = issues.filter((i) => i.status === 'closed' || i.status === 'done').length

  // Mock chart data (14 days)
  const runData = [0,0,0,0,0,0,0,0,0,0,0,12,16,9]
  const issuePriorityData = [0,0,0,0,0,0,0,0,0,0,0,6,10,3]
  const issueStatusData = [0,0,0,0,0,0,0,0,0,0,0,6,10,3]
  const successRateData = [0,0,0,0,0,0,0,0,0,0,0,33,100,33]

  return (
    <div className="main">
      {/* Header */}
      <div className="page-head">
        <div className="page-title">
          <h1><span className="accent">Command</span> Center</h1>
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
          <span>● Live · {timeAgo(lastUpdated)} · polling every 3s</span>
        </div>
      )}

      {/* Summary Stats */}
      <div className="dash-stats-row">
        <StatTile
          label="Agents Enabled"
          value={agents.length}
          sub={`${onlineCount} online · ${pausedCount} paused`}
          icon="◈"
          tone=""
        />
        <StatTile
          label="Tasks In Progress"
          value={workingCount}
          sub={`${agents.filter(a => a.status === 'thinking').length} thinking · ${agents.filter(a => a.status === 'idle').length} idle`}
          icon="▷"
          tone="gold"
        />
        <StatTile
          label="Month Spend"
          value={`$${(totalSpent / 100).toFixed(2)}`}
          sub={totalBudget ? `of $${(totalBudget / 100).toFixed(2)}` : 'no budget set'}
          icon="$"
          tone="green"
        />
        <StatTile
          label="Pending Approvals"
          value={pausedCount}
          sub={pausedCount > 0 ? 'Awaiting review' : 'All clear'}
          icon="◉"
          tone={pausedCount > 0 ? 'red' : ''}
        />
      </div>

      {/* Quick Agent Overview */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="dash-section-title">Active Agents</h3>
          <button className="btn ghost" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => {}}>
            View All →
          </button>
        </div>
        <div className="mini-agent-grid">
          {agents.slice(0, 8).map((a) => (
            <MiniAgentCard key={a.id} agent={a} onOpen={onOpenAgent} />
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="dash-charts-row">
        <ChartCard title="Run Activity" subtitle="Last 14 days">
          <Sparkline data={runData} color="var(--green)" height={80} />
          <div className="dash-chart-xlabels">
            <span>4/15</span>
            <span className="ml-auto">4/28</span>
          </div>
        </ChartCard>

        <ChartCard
          title="Issues by Priority"
          subtitle="Last 14 days"
          legend={[
            { label: 'Critical', color: 'var(--red)' },
            { label: 'High', color: 'var(--orange)' },
            { label: 'Medium', color: 'var(--gold)' },
            { label: 'Low', color: 'var(--text-muted)' },
          ]}
        >
          <Sparkline data={issuePriorityData} color="var(--orange)" height={80} />
        </ChartCard>

        <ChartCard
          title="Issues by Status"
          subtitle="Last 14 days"
          legend={[
            { label: 'To Do', color: 'var(--cyan)' },
            { label: 'In Review', color: 'var(--accent)' },
            { label: 'Done', color: 'var(--green)' },
            { label: 'Blocked', color: 'var(--red)' },
          ]}
        >
          <Sparkline data={issueStatusData} color="var(--cyan)" height={80} />
        </ChartCard>

        <ChartCard title="Success Rate" subtitle="Last 14 days">
          <Sparkline data={successRateData} color="var(--green)" height={80} />
          <div className="dash-chart-xlabels">
            <span>4/15</span>
            <span className="ml-auto">4/28</span>
          </div>
        </ChartCard>
      </div>

      {/* Bottom Row: Recent Activity + Recent Issues */}
      <div className="dash-bottom-row">
        <div className="min-w-0">
          <h3 className="dash-section-title">Recent Activity</h3>
          <div className="dash-list-box">
            {agents.slice(0, 6).map((a, i) => (
              <ActivityRow
                key={a.id}
                avatar={initials(a.name)}
                name="System"
                action={i % 3 === 0 ? 'created API key for' : i % 3 === 1 ? 'updated config for' : 'synced data for'}
                target={`${a.name} (${a.title})`}
                time={`${(i + 1) * 7}m ago`}
              />
            ))}
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="dash-section-title">Recent Issues</h3>
            {issuesUpdated && (
              <span className="mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                {issuesLoading ? '⟳ syncing…' : `● ${timeAgo(issuesUpdated)}`}
              </span>
            )}
          </div>
          {issuesError && (
            <div className="rt-banner err" style={{ marginBottom: 8, fontSize: 11 }}>
              ⚠ Issues fetch failed: {issuesError}
            </div>
          )}
          <div className="dash-list-box">
            {issues.length === 0 && !issuesLoading && !issuesError ? (
              <div className="dash-task-row" style={{ color: 'var(--text-muted)', justifyContent: 'center' }}>
                No issues found
              </div>
            ) : (
              issues.slice(0, 10).map((issue) => (
                <IssueRow
                  key={issue.id || issue.uuid}
                  status={issue.status || 'open'}
                  code={issue.identifier || issue.code || `ISS-${issue.id?.slice(0, 6)}`}
                  title={issue.title || 'Untitled issue'}
                  assignee={issue.assignee?.name || issue.assigneeName}
                  time={issue.updatedAt ? timeAgo(issue.updatedAt) : '—'}
                />
              ))
            )}
          </div>
          <div style={{ marginTop: 6, fontSize: 10, color: 'var(--text-muted)', textAlign: 'right' }}>
            {openIssues} open · {closedIssues} closed · polling 3s
          </div>
        </div>
      </div>
    </div>
  )
}
