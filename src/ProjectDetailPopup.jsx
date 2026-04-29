import { useState, useEffect, useRef } from 'react'
import { fetchProjectById, updateProject } from './api/agentService'

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const PROJECT_STATUS_META = {
  backlog:     { colour: '#9ca3af', label: 'Backlog' },
  planned:     { colour: '#3b82f6', label: 'Planned' },
  in_progress: { colour: '#eab308', label: 'In Progress' },
  completed:   { colour: '#4ade80', label: 'Completed' },
  cancelled:   { colour: '#6b7280', label: 'Cancelled' },
}

const ALL_STATUSES = ['backlog', 'planned', 'in_progress', 'completed', 'cancelled']

const PROJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#64748b', '#a855f7', '#14b8a6',
]

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

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function toDateString(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().split('T')[0]
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function ProjectDetailPopup({ project, onClose, onUpdated }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const overlayRef = useRef(null)

  // Edit form state
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editColor, setEditColor] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editTargetDate, setEditTargetDate] = useState('')

  useEffect(() => {
    if (!project?.id) return
    let cancelled = false
    setLoading(true)

    fetchProjectById(project.id)
      .then((data) => {
        if (!cancelled) {
          setDetail(data)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [project?.id])

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Close on overlay click
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose()
  }

  const src = detail || project
  const status = resolveStatus(src)
  const statusMeta = PROJECT_STATUS_META[status] || { colour: '#9ca3af', label: src.status || 'Unknown' }

  // Enter edit mode
  const handleEdit = () => {
    setEditName(src.name || '')
    setEditDescription(src.description || '')
    setEditColor(src.color || '#6366f1')
    setEditStatus(status)
    setEditTargetDate(toDateString(src.targetDate))
    setSaveError(null)
    setEditing(true)
  }

  // Cancel edit
  const handleCancelEdit = () => {
    setEditing(false)
    setSaveError(null)
  }

  // Save changes
  const handleSave = async () => {
    if (!editName.trim()) {
      setSaveError('Project name is required.')
      return
    }

    setSaving(true)
    setSaveError(null)

    try {
      const body = {
        name: editName.trim(),
        description: editDescription.trim() || null,
        color: editColor,
        status: editStatus,
        targetDate: editTargetDate || null,
      }

      const updated = await updateProject(src.id, body)
      setDetail(updated)
      setEditing(false)
      onUpdated?.()
    } catch (err) {
      setSaveError(err.message || 'Failed to update project')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="popup-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="popup-container project-detail-popup">
        {/* Header */}
        <div className="popup-header">
          <div className="popup-header-left">
            <div
              className="project-detail-color-bar"
              style={{ background: (editing ? editColor : src.color) || statusMeta.colour }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              {editing ? (
                <input
                  className="form-input project-edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Project name"
                  maxLength={200}
                />
              ) : (
                <h2 className="popup-title">{src.name || 'Untitled Project'}</h2>
              )}
              <div className="popup-subtitle">
                {!editing && (
                  <span
                    className="project-status-badge"
                    style={{
                      color: statusMeta.colour,
                      backgroundColor: statusMeta.colour + '18',
                      borderColor: statusMeta.colour + '30',
                    }}
                  >
                    {statusMeta.label}
                  </span>
                )}
                {src.urlKey && !editing && (
                  <span className="mono project-detail-key">{src.urlKey}</span>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {!editing && (
              <button
                className="popup-close project-edit-btn"
                onClick={handleEdit}
                aria-label="Edit project"
                title="Edit project"
              >
                ✎
              </button>
            )}
            <button className="popup-close" onClick={editing ? handleCancelEdit : onClose} aria-label={editing ? 'Cancel' : 'Close'}>
              {editing ? '✕' : '×'}
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && !detail && (
          <div className="popup-loading">
            <div className="spinner" />
            <p>Loading project details…</p>
          </div>
        )}

        {/* Content */}
        {(!loading || detail) && (
          <div className="popup-body project-detail-body">

            {/* ---- EDIT MODE ---- */}
            {editing ? (
              <>
                {/* Save Error */}
                {saveError && (
                  <div className="new-project-error">
                    <span>⚠</span> {saveError}
                  </div>
                )}

                {/* Description — full width */}
                <div className="project-detail-section">
                  <h4 className="project-detail-section-title">Description</h4>
                  <textarea
                    className="form-input form-textarea project-edit-textarea"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Describe this project…"
                    rows={5}
                    maxLength={2000}
                  />
                </div>

                {/* Color + Status row */}
                <div className="project-edit-row">
                  <div className="project-detail-section" style={{ flex: 1 }}>
                    <h4 className="project-detail-section-title">Color</h4>
                    <div className="color-picker">
                      {PROJECT_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={`color-swatch ${editColor === c ? 'active' : ''}`}
                          style={{ background: c }}
                          onClick={() => setEditColor(c)}
                          aria-label={`Select color ${c}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="project-detail-section">
                  <h4 className="project-detail-section-title">Status</h4>
                  <div className="status-options">
                    {ALL_STATUSES.map((s) => {
                      const meta = PROJECT_STATUS_META[s]
                      return (
                        <button
                          key={s}
                          type="button"
                          className={`status-option ${editStatus === s ? 'active' : ''}`}
                          onClick={() => setEditStatus(s)}
                        >
                          <span
                            className="project-status-dot"
                            style={{ background: meta?.colour || '#9ca3af' }}
                          />
                          {meta?.label || s}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Target Date */}
                <div className="project-detail-section">
                  <h4 className="project-detail-section-title">Target Date</h4>
                  <input
                    type="date"
                    className="form-input"
                    value={editTargetDate}
                    onChange={(e) => setEditTargetDate(e.target.value)}
                    style={{ maxWidth: 240 }}
                  />
                </div>

                {/* Save / Cancel */}
                <div className="new-project-actions">
                  <button
                    className="btn ghost"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn primary"
                    onClick={handleSave}
                    disabled={saving || !editName.trim()}
                  >
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* ---- VIEW MODE ---- */}

                {/* Description — always visible */}
                <div className="project-detail-section">
                  <h4 className="project-detail-section-title">Description</h4>
                  {src.description ? (
                    <p className="project-detail-description">{src.description}</p>
                  ) : (
                    <div className="project-detail-empty-box">
                      <span className="project-detail-empty-text">No description added yet. Click ✎ to add one.</span>
                    </div>
                  )}
                </div>

                {/* Details Grid */}
                <div className="project-detail-section">
                  <h4 className="project-detail-section-title">Details</h4>
                  <div className="project-detail-grid">
                    <div className="project-detail-field">
                      <span className="project-detail-label">Status</span>
                      <span className="project-detail-value">
                        <span
                          className="project-status-dot"
                          style={{ background: statusMeta.colour }}
                        />
                        {statusMeta.label}
                      </span>
                    </div>
                    <div className="project-detail-field">
                      <span className="project-detail-label">Target Date</span>
                      <span className="project-detail-value">{formatDate(src.targetDate)}</span>
                    </div>
                    <div className="project-detail-field">
                      <span className="project-detail-label">Created</span>
                      <span className="project-detail-value">{formatDate(src.createdAt)}</span>
                    </div>
                    <div className="project-detail-field">
                      <span className="project-detail-label">Updated</span>
                      <span className="project-detail-value">{formatDate(src.updatedAt)}</span>
                    </div>
                    {src.leadAgentId && (
                      <div className="project-detail-field">
                        <span className="project-detail-label">Lead Agent</span>
                        <span className="project-detail-value mono">{src.leadAgentId}</span>
                      </div>
                    )}
                    {src.env && (
                      <div className="project-detail-field">
                        <span className="project-detail-label">Environment</span>
                        <span className="project-detail-value">{src.env}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Goals */}
                {src.goals && src.goals.length > 0 && (
                  <div className="project-detail-section">
                    <h4 className="project-detail-section-title">
                      Goals ({src.goals.length})
                    </h4>
                    <div className="project-detail-goals">
                      {src.goals.map((goal) => (
                        <div key={goal.id} className="project-detail-goal-item">
                          <span className="project-detail-goal-icon">🎯</span>
                          <div>
                            <span className="project-detail-goal-title">{goal.title}</span>
                            <span className="project-detail-goal-id mono">{goal.id}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Codebase */}
                {src.codebase && (
                  <div className="project-detail-section">
                    <h4 className="project-detail-section-title">Codebase</h4>
                    <div className="project-detail-grid">
                      {src.codebase.repoUrl && (
                        <div className="project-detail-field">
                          <span className="project-detail-label">Repository</span>
                          <span className="project-detail-value">
                            <a href={src.codebase.repoUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
                              {src.codebase.repoName || src.codebase.repoUrl}
                            </a>
                          </span>
                        </div>
                      )}
                      {src.codebase.repoRef && (
                        <div className="project-detail-field">
                          <span className="project-detail-label">Branch / Ref</span>
                          <span className="project-detail-value mono">{src.codebase.repoRef}</span>
                        </div>
                      )}
                      <div className="project-detail-field">
                        <span className="project-detail-label">Origin</span>
                        <span className="project-detail-value">{src.codebase.origin || '—'}</span>
                      </div>
                      {src.codebase.effectiveLocalFolder && (
                        <div className="project-detail-field" style={{ gridColumn: '1 / -1' }}>
                          <span className="project-detail-label">Folder</span>
                          <span className="project-detail-value mono" style={{ fontSize: 12, wordBreak: 'break-all' }}>
                            {src.codebase.effectiveLocalFolder}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Workspaces */}
                {src.workspaces && src.workspaces.length > 0 && (
                  <div className="project-detail-section">
                    <h4 className="project-detail-section-title">
                      Workspaces ({src.workspaces.length})
                    </h4>
                    <div className="project-detail-workspaces">
                      {src.workspaces.map((ws, i) => (
                        <div key={ws.id || i} className="project-detail-workspace-item">
                          <span className="project-detail-workspace-name">
                            {ws.name || ws.id || `Workspace ${i + 1}`}
                          </span>
                          {ws.id && <span className="mono project-detail-workspace-id">{ws.id}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pause Info */}
                {src.pausedAt && (
                  <div className="project-detail-section">
                    <h4 className="project-detail-section-title">Pause Information</h4>
                    <div className="project-detail-grid">
                      <div className="project-detail-field">
                        <span className="project-detail-label">Paused At</span>
                        <span className="project-detail-value">{formatDate(src.pausedAt)}</span>
                      </div>
                      {src.pauseReason && (
                        <div className="project-detail-field" style={{ gridColumn: '1 / -1' }}>
                          <span className="project-detail-label">Reason</span>
                          <span className="project-detail-value">{src.pauseReason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Archive Info */}
                {src.archivedAt && (
                  <div className="project-detail-section">
                    <div className="project-detail-grid">
                      <div className="project-detail-field">
                        <span className="project-detail-label">Archived At</span>
                        <span className="project-detail-value">{formatDate(src.archivedAt)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* IDs */}
                <div className="project-detail-section">
                  <h4 className="project-detail-section-title">Identifiers</h4>
                  <div className="project-detail-grid">
                    <div className="project-detail-field" style={{ gridColumn: '1 / -1' }}>
                      <span className="project-detail-label">Project ID</span>
                      <span className="project-detail-value mono" style={{ fontSize: 12 }}>{src.id}</span>
                    </div>
                    <div className="project-detail-field" style={{ gridColumn: '1 / -1' }}>
                      <span className="project-detail-label">Company ID</span>
                      <span className="project-detail-value mono" style={{ fontSize: 12 }}>{src.companyId}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
