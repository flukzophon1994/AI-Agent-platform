import { useState, useRef, useEffect } from 'react'
import { createProject, fetchGoals } from './api/agentService'

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const PROJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#64748b', '#a855f7', '#14b8a6',
]

const PROJECT_STATUSES = [
  { value: 'backlog',     label: 'Backlog',     icon: '○' },
  { value: 'planned',     label: 'Planned',     icon: '◇' },
  { value: 'in_progress', label: 'In Progress', icon: '◑' },
  { value: 'completed',   label: 'Completed',   icon: '●' },
  { value: 'cancelled',   label: 'Cancelled',   icon: '✕' },
]

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function NewProjectPopup({ onClose, onCreated }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(PROJECT_COLORS[0])
  const [status, setStatus] = useState('planned')
  const [goalId, setGoalId] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Goals fetched from API
  const [goals, setGoals] = useState([])

  const overlayRef = useRef(null)
  const nameRef = useRef(null)

  // Fetch goals on mount
  useEffect(() => {
    let cancelled = false
    fetchGoals().then((data) => {
      if (!cancelled) setGoals(data)
    })
    return () => { cancelled = true }
  }, [])

  // Auto-focus name on mount
  useEffect(() => {
    nameRef.current?.focus()
  }, [])

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Project name is required.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const body = {
        name: name.trim(),
        description: description.trim() || null,
        color,
        status,
        goalId: goalId || null,
        goalIds: goalId ? [goalId] : [],
        targetDate: targetDate || null,
      }

      await createProject(body)
      onCreated?.()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to create project')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="popup-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="popup-container new-project-popup">
        {/* Header */}
        <div className="popup-header">
          <h2 className="popup-title">Create New Project</h2>
          <button className="popup-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {/* Form */}
        <form className="popup-body new-project-form" onSubmit={handleSubmit}>
          {/* Error */}
          {error && (
            <div className="new-project-error">
              <span>⚠</span> {error}
            </div>
          )}

          {/* Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="project-name">Name *</label>
            <input
              id="project-name"
              ref={nameRef}
              type="text"
              className="form-input"
              placeholder="e.g. Website Redesign"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
              required
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="project-desc">Description</label>
            <textarea
              id="project-desc"
              className="form-input form-textarea"
              placeholder="What is this project about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={2000}
            />
          </div>

          {/* Color */}
          <div className="form-group">
            <label className="form-label">Color</label>
            <div className="color-picker">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch ${color === c ? 'active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="form-group">
            <label className="form-label" htmlFor="project-status">Status</label>
            <div className="status-options">
              {PROJECT_STATUSES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  className={`status-option ${status === s.value ? 'active' : ''}`}
                  onClick={() => setStatus(s.value)}
                >
                  <span className="status-option-icon">{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Goal */}
          {goals.length > 0 && (
            <div className="form-group">
              <label className="form-label" htmlFor="project-goal">Goal</label>
              <select
                id="project-goal"
                className="form-input form-select"
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
              >
                <option value="">— No goal —</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title || g.id}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Target Date */}
          <div className="form-group">
            <label className="form-label" htmlFor="project-date">Target Date</label>
            <input
              id="project-date"
              type="date"
              className="form-input"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="new-project-actions">
            <button
              type="button"
              className="btn ghost"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn primary"
              disabled={submitting || !name.trim()}
            >
              {submitting ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
