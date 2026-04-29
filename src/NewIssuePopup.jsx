import { useState, useRef, useEffect } from 'react'
import { createIssue, fetchProjects, uploadAttachment } from './api/agentService'
import { AGENT_UUIDS, AGENT_API_NAMES } from './api/agentIds'

/* ── Constants ────────────────────────────────────────────────────────── */

const PRIORITIES = [
  { value: 'critical', label: 'Critical', color: '#ff4757' },
  { value: 'high',     label: 'High',     color: '#ff6b35' },
  { value: 'medium',   label: 'Medium',   color: '#ffc107' },
  { value: 'low',      label: 'Low',      color: '#4ecdc4' },
]

const STATUSES = [
  { value: 'todo',        label: 'Todo',        icon: '○' },
  { value: 'in_progress', label: 'In Progress', icon: '◑' },
  { value: 'done',        label: 'Done',        icon: '●' },
]

const AGENT_OPTIONS = Object.entries(AGENT_UUIDS).map(([localId, uuid]) => ({
  value: uuid,
  label: AGENT_API_NAMES[localId] || localId,
  localId,
}))

/* ── Component ─────────────────────────────────────────────────────────── */

export default function NewIssuePopup({ onClose, onCreated }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assigneeAgentId, setAssigneeAgentId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [priority, setPriority] = useState('medium')
  const [status, setStatus] = useState('todo')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Projects fetched from API
  const [projects, setProjects] = useState([])

  // Attachments (files selected before submit)
  const [attachments, setAttachments] = useState([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const overlayRef = useRef(null)
  const titleRef = useRef(null)

  // Fetch projects on mount
  useEffect(() => {
    let cancelled = false
    fetchProjects().then((data) => {
      if (!cancelled) setProjects(data)
    })
    return () => { cancelled = true }
  }, [])

  // Auto-focus title on mount
  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Close on overlay click
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose()
  }

  // File selection handler
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setAttachments((prev) => [...prev, ...files])
    }
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  const removeAttachment = (idx) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async () => {
    if (!title.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const body = {
        title: title.trim(),
        description: description.trim(),
        ...(assigneeAgentId ? { assigneeAgentId } : {}),
        ...(projectId ? { projectId } : {}),
        priority,
        status,
      }
      const result = await createIssue(body)

      // Upload attachments if any files were added
      if (attachments.length > 0 && result?.id) {
        setUploading(true)
        try {
          for (const file of attachments) {
            await uploadAttachment(result.id, file)
          }
        } catch (uploadErr) {
          console.warn('[NewIssuePopup] Some attachments failed:', uploadErr.message)
        }
        setUploading(false)
      }

      onCreated?.(result)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to create issue')
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = title.trim().length > 0 && !submitting

  const selectedPriority = PRIORITIES.find((p) => p.value === priority)
  const selectedStatus = STATUSES.find((s) => s.value === status)

  return (
    <div className="new-issue-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="new-issue-popup">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="new-issue-header">
          <div className="new-issue-header-left">
            <span className="new-issue-badge">HER</span>
            <span className="new-issue-header-sep">›</span>
            <span className="new-issue-header-title">New issue</span>
          </div>
          <div className="new-issue-header-actions">
            <button className="new-issue-header-btn" onClick={onClose} title="Close (Esc)">
              ✕
            </button>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────────── */}
        <div className="new-issue-body">
          {/* Title */}
          <textarea
            ref={titleRef}
            className="new-issue-title-input"
            placeholder="Issue title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            rows={1}
            onInput={(e) => {
              e.target.style.height = 'auto'
              e.target.style.height = e.target.scrollHeight + 'px'
            }}
          />

          {/* Assignment row: For {Assignee} in {Project} */}
          <div className="new-issue-assign-row">
            <span className="new-issue-assign-label">For</span>
            <select
              className="new-issue-select new-issue-assignee-select"
              value={assigneeAgentId}
              onChange={(e) => setAssigneeAgentId(e.target.value)}
            >
              <option value="">Unassigned</option>
              {AGENT_OPTIONS.map((agent) => (
                <option key={agent.value} value={agent.value}>
                  {agent.label}
                </option>
              ))}
            </select>
            <span className="new-issue-assign-label">in</span>
            <select
              className="new-issue-select new-issue-project-select"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="">No project</option>
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="new-issue-desc-wrapper">
            <textarea
              className="new-issue-desc-input"
              placeholder="Add description... (Markdown supported)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
            />
          </div>

          {/* Attachments list */}
          {attachments.length > 0 && (
            <div className="new-issue-attachments">
              {attachments.map((file, idx) => (
                <div key={idx} className="new-issue-attachment-item">
                  <span className="new-issue-attachment-icon">📎</span>
                  <span className="new-issue-attachment-name">{file.name}</span>
                  <span className="new-issue-attachment-size">
                    {file.size < 1024 * 1024
                      ? `${(file.size / 1024).toFixed(1)} KB`
                      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}
                  </span>
                  <button
                    className="new-issue-attachment-remove"
                    onClick={() => removeAttachment(idx)}
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Toolbar ────────────────────────────────────────────── */}
        <div className="new-issue-toolbar">
          <div className="new-issue-toolbar-left">
            {/* Status */}
            <div className="new-issue-toolbar-group">
              <button className="new-issue-toolbar-btn" title="Status">
                <span style={{ color: status === 'done' ? 'var(--green)' : status === 'in_progress' ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {selectedStatus?.icon}
                </span>
                <span>{selectedStatus?.label}</span>
              </button>
              <div className="new-issue-dropdown">
                {STATUSES.map((s) => (
                  <button
                    key={s.value}
                    className={`new-issue-dropdown-item ${status === s.value ? 'active' : ''}`}
                    onClick={() => setStatus(s.value)}
                  >
                    <span style={{ color: s.value === 'done' ? 'var(--green)' : s.value === 'in_progress' ? 'var(--accent)' : 'var(--text-muted)' }}>
                      {s.icon}
                    </span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div className="new-issue-toolbar-group">
              <button className="new-issue-toolbar-btn" title="Priority">
                <span
                  className="new-issue-priority-dot"
                  style={{ background: selectedPriority?.color }}
                />
                <span>{selectedPriority?.label}</span>
              </button>
              <div className="new-issue-dropdown">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    className={`new-issue-dropdown-item ${priority === p.value ? 'active' : ''}`}
                    onClick={() => setPriority(p.value)}
                  >
                    <span className="new-issue-priority-dot" style={{ background: p.color }} />
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Upload */}
            <button
              className="new-issue-toolbar-btn"
              title="Attach files"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
              </svg>
              <span>Upload</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
          </div>
        </div>

        {/* ── Error ──────────────────────────────────────────────── */}
        {error && (
          <div className="new-issue-error">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div className="new-issue-footer">
          <button className="new-issue-btn-discard" onClick={onClose} disabled={submitting}>
            Discard Draft
          </button>
          <button
            className={`new-issue-btn-create ${canSubmit ? '' : 'disabled'}`}
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {submitting ? (
              <>
                <span className="new-issue-spinner" />
                {uploading ? 'Uploading files...' : 'Creating...'}
              </>
            ) : (
              'Create Issue'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
