import { useState, useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { COLORS, RARITY, initials, StarRow } from './constants.jsx'
import { getAgentImage } from './agentImages'
import { fetchIssues, fetchIssueById, fetchIssueComments, fetchIssueDocuments } from './api/agentService'

/* ── Issue status colors (same as Issues page) ────────────────────── */

const ISSUE_STATUS_META = {
  backlog:    { colour: '#9ca3af', label: 'Backlog' },
  todo:       { colour: '#3b82f6', label: 'Todo' },
  inprogress: { colour: '#eab308', label: 'In Progress' },
  inreview:   { colour: '#8b5cf6', label: 'In Review' },
  done:       { colour: '#4ade80', label: 'Done' },
  cancelled:  { colour: '#6b7280', label: 'Cancelled' },
  blocked:    { colour: '#ef4444', label: 'Blocked' },
}

function resolveIssueStatus(issue) {
  const raw = (issue.status ?? '').toString().toLowerCase().replace(/[-_\s]/g, '')
  if (ISSUE_STATUS_META[raw]) return ISSUE_STATUS_META[raw]
  if (raw.includes('progress')) return ISSUE_STATUS_META.inprogress
  if (raw.includes('review'))   return ISSUE_STATUS_META.inreview
  if (raw.includes('block'))    return ISSUE_STATUS_META.blocked
  if (raw.includes('cancel'))   return ISSUE_STATUS_META.cancelled
  if (raw === 'done' || raw === 'closed' || raw === 'complete') return ISSUE_STATUS_META.done
  if (raw === 'open' || raw === 'new') return ISSUE_STATUS_META.todo
  return { colour: '#9ca3af', label: issue.status || 'Unknown' }
}

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

/* ── Issue Detail Popup ─────────────────────────────────────────────── */

function IssuePopup({ issue, onClose, agents }) {
  const [detail, setDetail] = useState(null)
  const [comments, setComments] = useState([])
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!issue?.id) return
    let cancelled = false
    setLoading(true)

    Promise.all([
      fetchIssueById(issue.id),
      fetchIssueComments(issue.id),
      fetchIssueDocuments(issue.id),
    ]).then(([issueData, commentsData, documentsData]) => {
      if (!cancelled) {
        setDetail(issueData)
        setComments(commentsData)
        setDocuments(documentsData)
        setLoading(false)
      }
    }).catch(() => {
      if (!cancelled) setLoading(false)
    })

    return () => { cancelled = true }
  }, [issue?.id])

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const src = detail || issue
  const resolvedStatus = resolveIssueStatus(src)
  const identifier = src.identifier || src.key || src.number || `#${issue.id || ''}`
  const title = src.title || src.name || src.summary || 'Untitled'

  // Find agent name
  const agentId = src.assigneeAgentId || issue.assigneeAgentId
  const agentName = agents.find((a) =>
    a.apiData?.id === agentId || a.apiData?.uuid === agentId
  )?.name || null

  // Get AI response from comments (first comment with body)
  const aiComment = comments.length > 0 ? comments[0] : null
  const commentBody = aiComment?.body || null

  // Fallback from detail fields
  const fallbackResponse = detail
    ? (detail.feedback || detail.result || detail.output || detail.response || detail.answer ||
       detail.body || detail.resolution || detail.aiResponse || detail.message || null)
    : null

  const hasComment = !!commentBody
  const hasDocs = documents.length > 0
  const hasFallback = !!fallbackResponse
  const hasDescription = !!issue.description
  const hasAnyContent = hasComment || hasDocs || hasFallback || hasDescription

  return (
    <div className="issue-popup-overlay" onClick={onClose}>
      <div className="issue-popup" onClick={(e) => e.stopPropagation()}>
        <div className="issue-popup-header">
          <div>
            <span className="issue-popup-id mono">{identifier}</span>
            <span className="issue-popup-status" style={{ background: `${resolvedStatus.colour}22`, color: resolvedStatus.colour }}>
              {resolvedStatus.label}
            </span>
          </div>
          <button className="issue-popup-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <h3 className="issue-popup-title">{title}</h3>

        <div className="issue-popup-meta">
          {agentName && (
            <span className="issue-popup-meta-item">
              <span className="issue-popup-meta-label">Agent</span>
              <span>{agentName}</span>
            </span>
          )}
          {(src.priority || issue.priority) && (
            <span className="issue-popup-meta-item">
              <span className="issue-popup-meta-label">Priority</span>
              <span style={{ textTransform: 'capitalize' }}>{src.priority || issue.priority}</span>
            </span>
          )}
          {(src.createdAt || src.startedAt || issue.createdAt || issue.started_at) && (
            <span className="issue-popup-meta-item">
              <span className="issue-popup-meta-label">Created</span>
              <span className="mono">{new Date(src.createdAt || src.startedAt || issue.createdAt || issue.started_at).toLocaleString()}</span>
            </span>
          )}
          {(src.completedAt || src.completed_at || issue.completedAt || issue.completed_at) && (
            <span className="issue-popup-meta-item">
              <span className="issue-popup-meta-label">Completed</span>
              <span className="mono">{new Date(src.completedAt || src.completed_at || issue.completedAt || issue.completed_at).toLocaleString()}</span>
            </span>
          )}
        </div>

        <div className="issue-popup-divider" />

        <div className="issue-popup-body">
          {loading ? (
            <div className="issue-popup-loading">
              <span className="issue-popup-spinner" />
              Loading AI response…
            </div>
          ) : hasAnyContent ? (
            <>
              {/* Comment (AI response) */}
              {hasComment && (
                <div className="issue-popup-response">
                  <div className="issue-popup-response-label">
                    AI Response
                    {aiComment.createdAt && (
                      <span className="issue-popup-response-time">
                        {new Date(aiComment.createdAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="issue-popup-response-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{commentBody}</ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Documents (plans, reports, etc.) */}
              {hasDocs && documents.map((doc, idx) => (
                <div className="issue-popup-response" key={doc.id || idx}>
                  <div className="issue-popup-response-label">
                    📄 {doc.title || doc.key || `Document ${idx + 1}`}
                    {doc.format && (
                      <span className="issue-popup-response-time">{doc.format}</span>
                    )}
                  </div>
                  <div className="issue-popup-response-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{doc.body || ''}</ReactMarkdown>
                  </div>
                </div>
              ))}

              {/* Fallback if no comment or docs */}
              {!hasComment && !hasDocs && hasFallback && (
                <div className="issue-popup-response">
                  <div className="issue-popup-response-label">AI Response</div>
                  <div className="issue-popup-response-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{fallbackResponse}</ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Description as last resort */}
              {!hasComment && !hasDocs && !hasFallback && hasDescription && (
                <div className="issue-popup-response">
                  <div className="issue-popup-response-label">Description</div>
                  <div className="issue-popup-response-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{issue.description}</ReactMarkdown>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="issue-popup-empty">
              No AI response available yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Dashboard (Overview / Command Center) ─────────────────────────── */

export default function MissionControl({ agents, onOpenAgent, loading, error, lastUpdated, onRefresh }) {
  const [issues, setIssues] = useState([])
  const [issuesLoading, setIssuesLoading] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState(null)
  const [issuesError, setIssuesError] = useState(null)
  const [issuesUpdated, setIssuesUpdated] = useState(null)
  const issuesTimerRef = useRef()

  const onlineCount = agents.filter((a) => a.status === 'running').length
  const pausedCount = agents.filter((a) => a.status === 'paused').length
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
  const inProgressCount = issues.filter((i) => {
    const s = (i.status ?? '').toString().toLowerCase().replace(/[-_\s]/g, '')
    return s === 'inprogress' || s === 'in_progress' || s.includes('progress')
  }).length
  const openIssues = issues.filter((i) => i.status === 'open' || !i.status).length
  const closedIssues = issues.filter((i) => i.status === 'closed' || i.status === 'done').length

  // Fetch pending approvals
  const [pendingApprovals, setPendingApprovals] = useState(0)
  useEffect(() => {
    let cancelled = false
    async function loadApprovals() {
      try {
        const res = await fetch(
          '/api/companies/39e68b6f-0d66-4033-9899-e6b94474bcfe/approvals?status=pending',
          { headers: { Authorization: 'Bearer pcp_c4efebee09b45a3119c95375af0c0f3130221ea259d08256', 'Content-Type': 'application/json' } }
        )
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        const list = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : [])
        setPendingApprovals(list.length)
      } catch { /* ignore */ }
    }
    loadApprovals()
    const id = setInterval(loadApprovals, 3000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

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
          value={inProgressCount}
          sub={`${issues.length} total issues · ${closedIssues} done`}
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
          value={pendingApprovals}
          sub={pendingApprovals > 0 ? 'Awaiting review' : 'All clear'}
          icon="◉"
          tone={pendingApprovals > 0 ? 'red' : ''}
        />
      </div>

      {/* Charts Row — below stat tiles */}
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

      {/* Active Agents — latest 4 issues with assigned agents */}
      <div className="mb-6">
        <h3 className="dash-section-title" style={{ marginBottom: 12 }}>Active Agents</h3>
        <div className="dash-active-agents-list">
          {issues
            .slice()
            .sort((a, b) => {
              const da = new Date(a.createdAt || a.created_at || a.updatedAt || a.updated_at || 0).getTime()
              const db = new Date(b.createdAt || b.created_at || b.updatedAt || b.updated_at || 0).getTime()
              return db - da
            })
            .slice(0, 8)
            .map((issue) => {
              const agent = agents.find((ag) =>
                ag.apiData?.id === issue.assigneeAgentId ||
                ag.apiData?.uuid === issue.assigneeAgentId
              )
              if (!agent) return null
              const color = COLORS[agent.id] || 'violet'
              const rar = RARITY[agent.id] || { tier: 'SR', stars: 4 }
              const img = getAgentImage(agent.id)
              const online = isOnline(agent)
              const resolvedStatus = resolveIssueStatus(issue)
              const issueStatus = resolvedStatus.label
              const startedAt = issue.startedAt || issue.started_at || null
              const completedAt = issue.completedAt || issue.completed_at || null
              const identifier = issue.identifier || issue.key || issue.number || `#${issue.id || ''}`
              const title = issue.title || issue.name || issue.summary || 'Untitled'

              return (
                <div key={issue.id || identifier} className="dash-active-agent-row">
                  {/* Agent Card */}
                  <div
                    className="mini-agent-card dash-active-agent-card"
                    onClick={() => onOpenAgent(agent.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpenAgent(agent.id) }}
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

                  {/* Issue Detail Box */}
                  <div className="dash-issue-detail-box clickable" onClick={() => setSelectedIssue(issue)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedIssue(issue) }}>
                    <div className="dash-issue-detail-header">
                      <span className="dash-issue-detail-id mono">{identifier}</span>
                      <span className="dash-issue-detail-status" style={{ background: `${resolvedStatus.colour}22`, color: resolvedStatus.colour }}>{issueStatus}</span>
                    </div>
                    <div className="dash-issue-detail-title">{title}</div>
                    <div className="dash-issue-detail-times">
                      {startedAt && (
                        <span className="dash-issue-detail-time">
                          <span className="dash-issue-detail-label">Start</span>
                          <span className="mono">{new Date(startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </span>
                      )}
                      {completedAt && (
                        <span className="dash-issue-detail-time">
                          <span className="dash-issue-detail-label">End</span>
                          <span className="mono">{new Date(completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      </div>

      {/* Issue Detail Popup */}
      {selectedIssue && (
        <IssuePopup issue={selectedIssue} onClose={() => setSelectedIssue(null)} agents={agents} />
      )}
    </div>
  )
}
