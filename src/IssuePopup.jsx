import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { fetchIssueById, fetchIssueComments, fetchIssueDocuments } from './api/agentService'
import { notifyAgentReply, wasIssueNotified } from './api/telegram'

/* ── Issue status colors ────────────────────────────────────────────── */

const ISSUE_STATUS_META = {
  backlog:    { colour: '#9ca3af', label: 'Backlog' },
  todo:       { colour: '#3b82f6', label: 'Todo' },
  inprogress: { colour: '#eab308', label: 'In Progress' },
  inreview:   { colour: '#8b5cf6', label: 'In Review' },
  done:       { colour: '#4ade80', label: 'Done' },
  cancelled:  { colour: '#6b7280', label: 'Cancelled' },
  blocked:    { colour: '#ef4444', label: 'Blocked' },
}

export function resolveIssueStatus(issue) {
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

/* ── Issue Detail Popup ─────────────────────────────────────────────── */

export default function IssuePopup({ issue, onClose, agents }) {
  const [detail, setDetail] = useState(null)
  const [comments, setComments] = useState([])
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('description')
  const telegramNotifiedRef = useRef(false)

  useEffect(() => {
    if (!issue?.id) return
    let cancelled = false
    setLoading(true)
    telegramNotifiedRef.current = false

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

        // ── Telegram notification on agent reply (deduplicated) ──
        const hasAiContent = (Array.isArray(commentsData) && commentsData.length > 0) ||
                             (Array.isArray(documentsData) && documentsData.length > 0)
        if (hasAiContent && !telegramNotifiedRef.current && !wasIssueNotified(issue.id)) {
          telegramNotifiedRef.current = true

          // Build the AI response text
          let responseText = ''
          if (commentsData.length > 0) {
            responseText = commentsData.map((c) => c.body || '').join('\n\n')
          }
          if (!responseText && documentsData.length > 0) {
            responseText = documentsData.map((d) => d.body || '').join('\n\n')
          }
          // Fallback fields
          if (!responseText && issueData) {
            responseText = issueData.feedback || issueData.result || issueData.output ||
                           issueData.response || issueData.answer || issueData.body || ''
          }

          if (responseText) {
            const agentId = issueData?.assigneeAgentId || issue?.assigneeAgentId
            const agentName = agents.find((a) =>
              a.apiData?.id === agentId || a.apiData?.uuid === agentId
            )?.name || 'Agent'
            const identifier = issueData?.identifier || issue?.identifier ||
                               issueData?.key || issue?.key || `#${issue.id || ''}`
            const issueTitle = issueData?.title || issue?.title || 'Untitled'

            notifyAgentReply({
              issueId: issue.id,
              issueTitle,
              agentName,
              aiResponse: responseText,
              identifier,
            }).catch((err) => {
              console.warn('[telegram] Notification failed:', err.message)
            })
          }
        }
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
  const hasDescription = !!(issue.description || detail?.description)
  const descriptionText = issue.description || detail?.description || ''

  // Combine AI response content
  const aiResponseContent = []
  if (hasComment) aiResponseContent.push({ type: 'comment', data: aiComment })
  if (hasDocs) documents.forEach((doc, idx) => aiResponseContent.push({ type: 'doc', data: doc, idx }))
  if (!hasComment && !hasDocs && hasFallback) aiResponseContent.push({ type: 'fallback', data: fallbackResponse })

  const hasAnyAiContent = aiResponseContent.length > 0

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

        {/* Tabs */}
        <div className="issue-popup-tabs">
          <button
            className={`issue-popup-tab ${activeTab === 'description' ? 'active' : ''}`}
            onClick={() => setActiveTab('description')}
          >
            Description
          </button>
          <button
            className={`issue-popup-tab ${activeTab === 'ai-response' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai-response')}
          >
            AI Response
          </button>
        </div>

        <div className="issue-popup-body">
          {loading ? (
            <div className="issue-popup-loading">
              <span className="issue-popup-spinner" />
              Loading…
            </div>
          ) : activeTab === 'description' ? (
            hasDescription ? (
              <div className="issue-popup-response-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{descriptionText}</ReactMarkdown>
              </div>
            ) : (
              <div className="issue-popup-empty">
                No description available.
              </div>
            )
          ) : (
            /* AI Response tab */
            hasAnyAiContent ? (
              <>
                {aiResponseContent.map((item, idx) => {
                  if (item.type === 'comment') {
                    return (
                      <div className="issue-popup-response" key={`comment-${idx}`}>
                        <div className="issue-popup-response-label">
                          AI Response
                          {item.data.createdAt && (
                            <span className="issue-popup-response-time">
                              {new Date(item.data.createdAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="issue-popup-response-content">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.data.body}</ReactMarkdown>
                        </div>
                      </div>
                    )
                  }
                  if (item.type === 'doc') {
                    const doc = item.data
                    return (
                      <div className="issue-popup-response" key={`doc-${doc.id || item.idx}`}>
                        <div className="issue-popup-response-label">
                          📄 {doc.title || doc.key || `Document ${item.idx + 1}`}
                          {doc.format && (
                            <span className="issue-popup-response-time">{doc.format}</span>
                          )}
                        </div>
                        <div className="issue-popup-response-content">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{doc.body || ''}</ReactMarkdown>
                        </div>
                      </div>
                    )
                  }
                  return (
                    <div className="issue-popup-response" key={`fallback-${idx}`}>
                      <div className="issue-popup-response-label">AI Response</div>
                      <div className="issue-popup-response-content">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.data}</ReactMarkdown>
                      </div>
                    </div>
                  )
                })}
              </>
            ) : (
              <div className="issue-popup-empty">
                No AI response available yet.
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
