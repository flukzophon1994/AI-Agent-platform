import { useState, useEffect, useMemo, useCallback } from 'react'
import IssuePopup from './IssuePopup'

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */
const API_URL =
  '/api/companies/39e68b6f-0d66-4033-9899-e6b94474bcfe/issues'

const HEADERS = {
  Authorization: 'Bearer pcp_4b51a8d591ad50605b76cdded4009316c01f554a3ab65db5',
  'Content-Type': 'application/json',
}

/** Status colour map — Paperclip workflow (7 states) */
const STATUS_META = {
  backlog:    { colour: '#9ca3af', label: 'Backlog' },
  todo:       { colour: '#3b82f6', label: 'Todo' },
  inprogress: { colour: '#eab308', label: 'In Progress' },
  inreview:   { colour: '#8b5cf6', label: 'In Review' },
  done:       { colour: '#4ade80', label: 'Done' },
  cancelled:  { colour: '#6b7280', label: 'Cancelled' },
  blocked:    { colour: '#ef4444', label: 'Blocked' },
}

const FALLBACK_STATUS = { colour: '#9ca3af', label: 'Unknown' }

/** Rough "time ago" (English only – stays close to the reference design) */
function timeAgo(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const diff = Date.now() - d.getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day}d ago`
  const mo = Math.floor(day / 30)
  if (mo < 12) return `${mo}mo ago`
  return `${Math.floor(mo / 12)}y ago`
}

/** Derive a display status slug from the raw payload */
function resolveStatus(issue) {
  const raw = (issue.status ?? issue.state ?? '').toString().toLowerCase().replace(/[-_\s]/g, '')
  if (raw.includes('backlog')) return 'backlog'
  if (raw.includes('todo')) return 'todo'
  if (raw.includes('progress') || raw === 'inprogress' || raw === 'inprog') return 'inprogress'
  if (raw.includes('review') || raw === 'inreview') return 'inreview'
  if (raw.includes('done') || raw.includes('complete') || raw.includes('resolved')) return 'done'
  if (raw.includes('cancel')) return 'cancelled'
  if (raw.includes('block')) return 'blocked'
  if (raw.includes('open')) return 'todo'
  if (issue.completedAt || issue.closedAt || issue.resolvedAt) return 'done'
  return 'backlog'
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                    */
/* ------------------------------------------------------------------ */
function StatusDot({ status }) {
  const meta = STATUS_META[status] || FALLBACK_STATUS
  return (
    <span
      className="issue-status-dot"
      style={{ borderColor: meta.colour, color: meta.colour }}
      title={meta.label}
    >
      <span className="issue-status-fill" style={{ background: meta.colour }} />
    </span>
  )
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || FALLBACK_STATUS
  return (
    <span
      className="issue-status-badge"
      style={{
        color: meta.colour,
        backgroundColor: meta.colour + '18',
        borderColor: meta.colour + '30',
      }}
      title={meta.label}
    >
      {meta.label}
    </span>
  )
}

function IconSearch(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.34-4.34" />
    </svg>
  )
}

function IconPlus(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14" /><path d="M12 5v14" />
    </svg>
  )
}

function IconList(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 5h.01" /><path d="M3 12h.01" /><path d="M3 19h.01" />
      <path d="M8 5h13" /><path d="M8 12h13" /><path d="M8 19h13" />
    </svg>
  )
}

function IconBoard(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="18" height="18" x="3" y="3" rx="2" /><path d="M9 3v18" /><path d="M15 3v18" />
    </svg>
  )
}

function IconFilter(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z" />
    </svg>
  )
}

function IconSort(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m21 16-4 4-4-4" /><path d="M17 20V4" /><path d="m3 8 4-4 4 4" /><path d="M7 4v16" />
    </svg>
  )
}

function IconGroup(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" />
      <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" />
      <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */
export default function Issues({ agents = [] }) {
  const [raw, setRaw] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [viewMode, setViewMode] = useState('list') // 'list' | 'board'
  const [selectedIssue, setSelectedIssue] = useState(null)

  /* ---- fetch + poll every 3s ---- */
  useEffect(() => {
    let cancelled = false
    let loadingShown = true
    async function loadIssues() {
      try {
        if (loadingShown) { setLoading(true); loadingShown = false }
        setError(null)
        const res = await fetch(API_URL, { headers: HEADERS })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (cancelled) return
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.issues)
              ? data.issues
              : Array.isArray(data?.results)
                ? data.results
                : []
        setRaw(list)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load issues')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadIssues()
    const id = setInterval(loadIssues, 3000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  /* ---- helper: parse date for sorting ---- */
  function issueDate(i) {
    const d = i.createdAt || i.created_at || i.updatedAt || i.updated_at || i.modifiedAt
    return d ? new Date(d).getTime() : 0
  }

  /* ---- filter + sort (newest first) ---- */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const base = q
      ? raw.filter((i) =>
          (i.title || i.name || i.summary || i.subject || '')
            .toString()
            .toLowerCase()
            .includes(q) ||
          (i.identifier || i.key || i.number || i.id || '')
            .toString()
            .toLowerCase()
            .includes(q)
        )
      : raw
    return [...base].sort((a, b) => issueDate(b) - issueDate(a))
  }, [raw, query])

  const handleSearch = useCallback((e) => setQuery(e.target.value), [])

  /* ---- render helpers ---- */
  const renderIssueRow = (issue, idx) => {
    const status = resolveStatus(issue)
    const idText = issue.identifier || issue.key || issue.number || `#${idx + 1}`
    const title = issue.title || issue.name || issue.summary || issue.subject || 'Untitled'
    const updated = timeAgo(issue.updatedAt || issue.updated_at || issue.modifiedAt)
    return (
      <a
        key={issue.id || idx}
        className="issue-row issue-row--clickable"
        href="#"
        onClick={(e) => { e.preventDefault(); setSelectedIssue(issue) }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedIssue(issue) } }}
      >
        {/* Mobile status dot */}
        <span className="issue-row__mobile-dot">
          <StatusDot status={status} />
        </span>

        <span className="issue-row__inner">
          {/* Left: status + id + updated (mobile) */}
          <span className="issue-row__left">
            <span className="issue-row__desktop-dot">
              <StatusDot status={status} />
            </span>
            <span className="issue-row__desktop-badge">
              <StatusBadge status={status} />
            </span>
            <span className="issue-row__id mono">{idText}</span>
            <span className="issue-row__mobile-updated">{updated}</span>
          </span>

          {/* Title */}
          <span className="issue-row__title">{title}</span>

          {/* Right: updated time (desktop) */}
          <span className="issue-row__right">
            <span className="issue-row__updated">{updated}</span>
          </span>
        </span>
      </a>
    )
  }

  return (
    <div className="issues-page">
      {/* Sticky header */}
      <div className="issues-header">
        <h1 className="issues-header__title">Issues</h1>
      </div>

      {/* Toolbar */}
      <div className="issues-toolbar">
        <div className="issues-toolbar__left">
          <button className="issues-btn issues-btn--primary">
            <IconPlus className="issues-icon" />
            <span className="issues-btn__text">New Issue</span>
          </button>

          <div className="issues-search">
            <IconSearch className="issues-search__icon" />
            <input
              className="issues-search__input"
              type="text"
              placeholder="Search issues..."
              aria-label="Search issues"
              value={query}
              onChange={handleSearch}
            />
          </div>
        </div>

        <div className="issues-toolbar__right">
          {/* View toggle */}
          <div className="issues-view-toggle">
            <button
              className={`issues-view-btn ${viewMode === 'list' ? 'is-active' : ''}`}
              title="List view"
              onClick={() => setViewMode('list')}
            >
              <IconList />
            </button>
            <button
              className={`issues-view-btn ${viewMode === 'board' ? 'is-active' : ''}`}
              title="Board view"
              onClick={() => setViewMode('board')}
            >
              <IconBoard />
            </button>
          </div>

          <button className="issues-btn issues-btn--ghost" title="Filter">
            <IconFilter className="issues-icon" />
          </button>
          <button className="issues-btn issues-btn--ghost" title="Sort">
            <IconSort className="issues-icon" />
          </button>
          <button className="issues-btn issues-btn--ghost" title="Group">
            <IconGroup className="issues-icon" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="issues-body">
        {loading && (
          <div className="issues-placeholder">
            <div className="issues-spinner" />
            <p>Loading issues…</p>
          </div>
        )}

        {!loading && error && (
          <div className="issues-placeholder issues-placeholder--error">
            <p>⚠ {error}</p>
            <button
              className="issues-btn issues-btn--primary"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="issues-placeholder">
            <p>No issues found.</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="issues-list">
            {filtered.map(renderIssueRow)}
          </div>
        )}
      </div>

      {/* Issue Detail Popup */}
      {selectedIssue && (
        <IssuePopup issue={selectedIssue} onClose={() => setSelectedIssue(null)} agents={agents} />
      )}
    </div>
  )
}
