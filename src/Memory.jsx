import { useState, useEffect, useMemo } from 'react'
import { fetchActivityFeed } from './api/agentService'
import { AGENT_UUIDS, AGENT_API_NAMES, getLocalIdByUuid } from './api/agentIds'

/* ─── Constants ─────────────────────────────────────────────────────── */

/** Reverse map: Paperclip UUID → local agent name */
const UUID_TO_NAME = {}
for (const [localId, uuid] of Object.entries(AGENT_UUIDS)) {
  UUID_TO_NAME[uuid] = AGENT_API_NAMES[localId] || localId
}

/** Action type → display metadata */
const ACTION_META = {
  'agent.instructions_file_updated': {
    verb: 'updated instructions file',
    icon: '📄',
    colour: '#b58aff',
    group: 'Agent',
  },
  'agent.created': {
    verb: 'created agent',
    icon: '✨',
    colour: '#4ce0a0',
    group: 'Agent',
  },
  'agent.updated': {
    verb: 'updated agent',
    icon: '✏️',
    colour: '#b58aff',
    group: 'Agent',
  },
  'agent.paused': {
    verb: 'paused agent',
    icon: '⏸',
    colour: '#ff9966',
    group: 'Agent',
  },
  'agent.resumed': {
    verb: 'resumed agent',
    icon: '▶',
    colour: '#4ce0a0',
    group: 'Agent',
  },
  'agent.terminated': {
    verb: 'terminated agent',
    icon: '🛑',
    colour: '#ff5c7a',
    group: 'Agent',
  },
  'agent.key_created': {
    verb: 'created API key for',
    icon: '🔑',
    colour: '#f5c563',
    group: 'Agent',
  },
  'agent.hire_created': {
    verb: 'hired agent',
    icon: '🤝',
    colour: '#4ce0a0',
    group: 'Agent',
  },
  'issue.created': {
    verb: 'created issue',
    icon: '📋',
    colour: '#6fe6f0',
    group: 'Issue',
  },
  'issue.updated': {
    verb: 'updated issue',
    icon: '✏️',
    colour: '#b58aff',
    group: 'Issue',
  },
  'issue.comment_added': {
    verb: 'commented on issue',
    icon: '💬',
    colour: '#6fe6f0',
    group: 'Issue',
  },
  'issue.read_marked': {
    verb: 'marked issue as read',
    icon: '👁',
    colour: '#5d5673',
    group: 'Issue',
  },
  'issue.document_created': {
    verb: 'created document on issue',
    icon: '📝',
    colour: '#b58aff',
    group: 'Issue',
  },
  'issue.attachment_added': {
    verb: 'attached file to issue',
    icon: '📎',
    colour: '#6fe6f0',
    group: 'Issue',
  },
  'issue.checked_out': {
    verb: 'checked out issue',
    icon: '✅',
    colour: '#4ce0a0',
    group: 'Issue',
  },
  'issue.inbox_archived': {
    verb: 'archived issue from inbox',
    icon: '📦',
    colour: '#5d5673',
    group: 'Issue',
  },
  'issue.approval_linked': {
    verb: 'linked approval to issue',
    icon: '🔗',
    colour: '#b58aff',
    group: 'Issue',
  },
  'budget.policy_upserted': {
    verb: 'upserted budget policy',
    icon: '💰',
    colour: '#f5c563',
    group: 'Budget',
  },
  'approval.created': {
    verb: 'requested approval',
    icon: '🔔',
    colour: '#f5c563',
    group: 'Approval',
  },
  'approval.approved': {
    verb: 'approved',
    icon: '✅',
    colour: '#4ce0a0',
    group: 'Approval',
  },
  'approval.requester_wakeup_queued': {
    verb: 'queued approval wakeup',
    icon: '⏰',
    colour: '#ff9966',
    group: 'Approval',
  },
  'approval.comment_added': {
    verb: 'added comment to approval',
    icon: '💬',
    colour: '#6fe6f0',
    group: 'Approval',
  },
  'heartbeat.invoked': {
    verb: 'invoked heartbeat',
    icon: '💓',
    colour: '#ff6ec7',
    group: 'System',
  },
  'project.created': {
    verb: 'created project',
    icon: '📁',
    colour: '#4ce0a0',
    group: 'Project',
  },
  'goal.created': {
    verb: 'created goal',
    icon: '🎯',
    colour: '#4ce0a0',
    group: 'Goal',
  },
  'company.created': {
    verb: 'created company',
    icon: '🏢',
    colour: '#4ce0a0',
    group: 'Company',
  },
  'company.updated': {
    verb: 'updated company',
    icon: '🏢',
    colour: '#b58aff',
    group: 'Company',
  },
  'asset.created': {
    verb: 'created asset',
    icon: '🖼',
    colour: '#4ce0a0',
    group: 'Asset',
  },
}

const FALLBACK_META = {
  verb: 'performed action',
  icon: '•',
  colour: '#5d5673',
  group: 'Other',
}

/* ─── Helpers ───────────────────────────────────────────────────────── */

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

function formatDate(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Resolve an entity ID to a human-readable name */
function resolveEntity(entityType, entityId, details) {
  if (entityType === 'agent') {
    return UUID_TO_NAME[entityId] || entityId.slice(0, 8) + '…'
  }
  if (entityType === 'issue') {
    return details?.identifier
      ? `${details.identifier}`
      : entityId.slice(0, 8) + '…'
  }
  if (entityType === 'project') {
    return details?.name || entityId.slice(0, 8) + '…'
  }
  if (entityType === 'goal') {
    return details?.title || entityId.slice(0, 8) + '…'
  }
  if (entityType === 'company') {
    return details?.name || entityId.slice(0, 8) + '…'
  }
  return entityId.slice(0, 8) + '…'
}

/** Resolve actor to display name */
function resolveActor(activity) {
  if (activity.actorType === 'user') return 'Board'
  if (activity.actorType === 'system') return 'System'
  if (activity.actorType === 'agent') {
    // Try to resolve from actorId (which is a UUID for agents)
    return UUID_TO_NAME[activity.actorId] || activity.actorId.slice(0, 8) + '…'
  }
  return activity.actorId?.slice(0, 8) + '…' || 'Unknown'
}

/** Get actor initials for avatar */
function actorInitials(actorType, actorName) {
  if (actorType === 'user') return 'B'
  if (actorType === 'system') return 'S'
  // For agents, take first letter of each word
  return actorName
    .split(/[\s()]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/** Get actor avatar colour */
function actorColour(actorType) {
  if (actorType === 'user') return '#f5c563'
  if (actorType === 'system') return '#5d5673'
  return '#b58aff'
}

/** Extract detail description from the details object */
function detailDescription(action, details) {
  if (!details) return null
  if (action === 'agent.instructions_file_updated') {
    return details.path || null
  }
  if (action === 'issue.created') {
    return details.title || null
  }
  if (action === 'agent.created') {
    return details.name ? `${details.name} (${details.role || 'agent'})` : null
  }
  if (action === 'agent.hire_created') {
    return details.name || null
  }
  if (action === 'project.created') {
    return details.name || null
  }
  if (action === 'goal.created') {
    return details.title || null
  }
  if (action === 'company.created') {
    return details.name || null
  }
  return null
}

/* ─── Sub-components ────────────────────────────────────────────────── */

function ActivityAvatar({ actorType, actorName }) {
  const initials = actorInitials(actorType, actorName)
  const colour = actorColour(actorType)
  return (
    <div className="activity-avatar" style={{ background: colour + '22', color: colour, borderColor: colour + '40' }}>
      {initials}
    </div>
  )
}

function ActionIcon({ action }) {
  const meta = ACTION_META[action] || FALLBACK_META
  return (
    <span className="activity-action-icon" style={{ background: meta.colour + '18', color: meta.colour }}>
      {meta.icon}
    </span>
  )
}

function ActivityItem({ activity }) {
  const meta = ACTION_META[activity.action] || FALLBACK_META
  const actorName = resolveActor(activity)
  const entityName = resolveEntity(activity.entityType, activity.entityId, activity.details)
  const detail = detailDescription(activity.action, activity.details)

  return (
    <div className="activity-item">
      <div className="activity-timeline-line" />
      <ActivityAvatar actorType={activity.actorType} actorName={actorName} />
      <div className="activity-content">
        <div className="activity-header">
          <span className="activity-actor" style={{ color: actorColour(activity.actorType) }}>
            {actorName}
          </span>
          <span className="activity-verb">{meta.verb}</span>
          <span className="activity-entity" style={{ color: meta.colour }}>
            {entityName}
          </span>
        </div>
        {detail && (
          <div className="activity-detail">
            {detail}
          </div>
        )}
        <div className="activity-time" title={formatDate(activity.createdAt)}>
          {timeAgo(activity.createdAt)}
        </div>
      </div>
      <ActionIcon action={activity.action} />
    </div>
  )
}

/* ─── Filter options ────────────────────────────────────────────────── */

function getUniqueGroups(items) {
  const groups = new Set()
  items.forEach((item) => {
    const meta = ACTION_META[item.action]
    if (meta) groups.add(meta.group)
    else groups.add('Other')
  })
  return ['All', ...Array.from(groups).sort()]
}

/* ─── Main component ────────────────────────────────────────────────── */

export default function Memory() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterGroup, setFilterGroup] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [totalCount, setTotalCount] = useState(0)

  /* Fetch + poll every 5s */
  useEffect(() => {
    let cancelled = false
    let loadingShown = true

    async function load() {
      try {
        if (loadingShown) { setLoading(true); loadingShown = false }
        setError(null)
        const data = await fetchActivityFeed(0)
        if (cancelled) return
        setActivities(data)
        setTotalCount(data.length)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load activity')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    const id = setInterval(load, 5000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  /* Filtered list */
  const filtered = useMemo(() => {
    let list = activities

    // Group filter
    if (filterGroup !== 'All') {
      list = list.filter((item) => {
        const meta = ACTION_META[item.action] || FALLBACK_META
        return meta.group === filterGroup
      })
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter((item) => {
        const actor = resolveActor(item).toLowerCase()
        const entity = resolveEntity(item.entityType, item.entityId, item.details).toLowerCase()
        const action = item.action.toLowerCase()
        const detail = detailDescription(item.action, item.details)?.toLowerCase() || ''
        return actor.includes(q) || entity.includes(q) || action.includes(q) || detail.includes(q)
      })
    }

    return list
  }, [activities, filterGroup, searchQuery])

  const groups = useMemo(() => getUniqueGroups(activities), [activities])

  /* Stats */
  const stats = useMemo(() => {
    const byGroup = {}
    activities.forEach((item) => {
      const meta = ACTION_META[item.action] || FALLBACK_META
      byGroup[meta.group] = (byGroup[meta.group] || 0) + 1
    })
    return byGroup
  }, [activities])

  return (
    <div className="memory-page">
      {/* Header */}
      <div className="memory-header">
        <div className="memory-title-row">
          <h1 className="memory-title">
            <span className="memory-title-icon">◌</span>
            Activity Feed
          </h1>
          <div className="memory-count">
            {totalCount} event{totalCount !== 1 ? 's' : ''}
          </div>
        </div>
        <p className="memory-subtitle">
          Real-time event log from Paperclip — agents, issues, approvals, and system events.
        </p>
      </div>

      {/* Toolbar */}
      <div className="memory-toolbar">
        <div className="memory-search">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.34-4.34" />
          </svg>
          <input
            type="text"
            placeholder="Search events…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="memory-filters">
          <select
            className="memory-filter-select"
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
          >
            {groups.map((g) => (
              <option key={g} value={g}>
                {g === 'All' ? 'All types' : `${g} (${stats[g] || 0})`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats bar */}
      <div className="memory-stats">
        {Object.entries(stats).sort((a, b) => b[1] - a[1]).map(([group, count]) => (
          <button
            key={group}
            className={`memory-stat-chip ${filterGroup === group ? 'active' : ''}`}
            onClick={() => setFilterGroup(filterGroup === group ? 'All' : group)}
          >
            {group} <span className="memory-stat-count">{count}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && activities.length === 0 ? (
        <div className="memory-loading">
          <div className="memory-spinner" />
          <span>Loading activity feed…</span>
        </div>
      ) : error && activities.length === 0 ? (
        <div className="memory-error">
          <span className="memory-error-icon">⚠</span>
          <span>{error}</span>
          <button className="btn primary" onClick={() => window.location.reload()}>Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="memory-empty">
          <span className="memory-empty-icon">◌</span>
          <span>No events found{filterGroup !== 'All' || searchQuery ? ' matching your filters' : ''}.</span>
        </div>
      ) : (
        <div className="memory-list">
          {filtered.map((item) => (
            <ActivityItem key={item.id} activity={item} />
          ))}
        </div>
      )}

      {/* Footer */}
      {filtered.length > 0 && (
        <div className="memory-footer">
          Showing {filtered.length} of {totalCount} events
          {filterGroup !== 'All' && (
            <button className="memory-clear-filter" onClick={() => setFilterGroup('All')}>
              Clear filter
            </button>
          )}
        </div>
      )}
    </div>
  )
}
