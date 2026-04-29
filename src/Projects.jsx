import { useState, useEffect, useCallback } from 'react'
import { fetchProjects } from './api/agentService'
import ProjectDetailPopup from './ProjectDetailPopup'
import NewProjectPopup from './NewProjectPopup'

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const PROJECT_STATUS_META = {
  backlog:     { colour: '#9ca3af', label: 'Backlog',     icon: '○' },
  planned:     { colour: '#3b82f6', label: 'Planned',     icon: '◇' },
  in_progress: { colour: '#eab308', label: 'In Progress', icon: '◑' },
  completed:   { colour: '#4ade80', label: 'Completed',   icon: '●' },
  cancelled:   { colour: '#6b7280', label: 'Cancelled',   icon: '✕' },
}

const FALLBACK_STATUS = { colour: '#9ca3af', label: 'Unknown', icon: '?' }

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function resolveStatus(project) {
  const raw = (project.status ?? '').toString().toLowerCase().replace(/[-_\s]/g, '')
  if (PROJECT_STATUS_META[raw]) return raw
  if (raw.includes('progress') || raw === 'inprogress') return 'in_progress'
  if (raw.includes('complete') || raw.includes('done')) return 'completed'
  if (raw.includes('cancel')) return 'cancelled'
  if (raw.includes('plan')) return 'planned'
  if (raw.includes('backlog')) return 'backlog'
  return raw || 'planned'
}

function timeAgo(iso) {
  if (!iso) return ''
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
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                    */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }) {
  const meta = PROJECT_STATUS_META[status] || FALLBACK_STATUS
  return (
    <span
      className="project-status-badge"
      style={{
        color: meta.colour,
        backgroundColor: meta.colour + '18',
        borderColor: meta.colour + '30',
      }}
    >
      {meta.icon} {meta.label}
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

function IconFolder(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Project Card                                                      */
/* ------------------------------------------------------------------ */

function ProjectCard({ project, onClick }) {
  const status = resolveStatus(project)
  const meta = PROJECT_STATUS_META[status] || FALLBACK_STATUS

  return (
    <button className="project-card" onClick={() => onClick(project)}>
      <div className="project-card-header">
        <div className="project-card-color" style={{ background: project.color || meta.colour }} />
        <div className="project-card-info">
          <h3 className="project-card-name">{project.name || 'Untitled'}</h3>
          <div className="project-card-meta">
            <StatusBadge status={status} />
            {project.targetDate && (
              <span className="project-card-date">Due {formatDate(project.targetDate)}</span>
            )}
          </div>
        </div>
      </div>
      {project.description && (
        <p className="project-card-desc">{project.description}</p>
      )}
      {project.goals && project.goals.length > 0 && (
        <div className="project-card-goals">
          {project.goals.map((g) => (
            <span key={g.id} className="project-card-goal-tag" title={g.title}>
              🎯 {g.title.length > 60 ? g.title.slice(0, 60) + '…' : g.title}
            </span>
          ))}
        </div>
      )}
      <div className="project-card-footer">
        <span className="project-card-time">Created {timeAgo(project.createdAt)}</span>
        {project.urlKey && (
          <span className="project-card-key mono">{project.urlKey}</span>
        )}
      </div>
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [selectedProject, setSelectedProject] = useState(null)
  const [newProjectOpen, setNewProjectOpen] = useState(false)

  /* ---- fetch + poll every 5s ---- */
  useEffect(() => {
    let cancelled = false
    let loadingShown = true

    async function loadProjects() {
      try {
        if (loadingShown) { setLoading(true); loadingShown = false }
        setError(null)
        const data = await fetchProjects()
        if (!cancelled) setProjects(data)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load projects')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadProjects()
    const id = setInterval(loadProjects, 5000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  /* ---- filter ---- */
  const filtered = query.trim()
    ? projects.filter((p) => {
        const q = query.toLowerCase()
        return (
          (p.name || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.urlKey || '').toLowerCase().includes(q) ||
          (p.status || '').toLowerCase().includes(q)
        )
      })
    : projects

  /* ---- grouped by status ---- */
  const grouped = {}
  const statusOrder = ['in_progress', 'planned', 'backlog', 'completed', 'cancelled']
  filtered.forEach((p) => {
    const s = resolveStatus(p)
    if (!grouped[s]) grouped[s] = []
    grouped[s].push(p)
  })
  const orderedGroups = statusOrder
    .filter((s) => grouped[s])
    .map((s) => ({ status: s, projects: grouped[s] }))

  // Add any unknown statuses at the end
  Object.keys(grouped).forEach((s) => {
    if (!statusOrder.includes(s)) {
      orderedGroups.push({ status: s, projects: grouped[s] })
    }
  })

  const handleProjectCreated = useCallback(() => {
    // Immediately refresh projects list
    fetchProjects().then(setProjects)
  }, [])

  /* ---- Render ---- */
  return (
    <div className="projects-page">
      {/* Header */}
      <div className="projects-header">
        <div>
          <h1 className="projects-title">
            <IconFolder style={{ display: 'inline', verticalAlign: '-2px', marginRight: 8 }} />
            Projects
          </h1>
          <p className="projects-subtitle">
            {loading && projects.length === 0 ? 'Loading…' : `${projects.length} project${projects.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          className="btn primary"
          onClick={() => setNewProjectOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <IconPlus /> New Project
        </button>
      </div>

      {/* Search */}
      <div className="projects-search-bar">
        <IconSearch className="projects-search-icon" />
        <input
          type="text"
          className="projects-search-input"
          placeholder="Search projects…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="projects-error">
          <span>⚠</span> {error}
        </div>
      )}

      {/* Loading */}
      {loading && projects.length === 0 && (
        <div className="projects-loading">
          <div className="spinner" />
          <p>Loading projects…</p>
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="projects-empty">
          <IconFolder style={{ width: 48, height: 48, opacity: 0.3 }} />
          <p>{query ? 'No projects match your search.' : 'No projects yet. Create one to get started.'}</p>
          {!query && (
            <button className="btn primary" onClick={() => setNewProjectOpen(true)}>
              <IconPlus /> Create Project
            </button>
          )}
        </div>
      )}

      {/* Project Grid */}
      {orderedGroups.map(({ status, projects: groupProjects }) => (
        <div key={status} className="projects-group">
          <div className="projects-group-header">
            <StatusBadge status={status} />
            <span className="projects-group-count">{groupProjects.length}</span>
          </div>
          <div className="projects-grid">
            {groupProjects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onClick={setSelectedProject}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Detail Popup */}
      {selectedProject && (
        <ProjectDetailPopup
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onUpdated={handleProjectCreated}
        />
      )}

      {/* New Project Popup */}
      {newProjectOpen && (
        <NewProjectPopup
          onClose={() => setNewProjectOpen(false)}
          onCreated={handleProjectCreated}
        />
      )}
    </div>
  )
}
