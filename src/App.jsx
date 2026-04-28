import { useState, useEffect, useRef, Component } from 'react'
import useAgents from './hooks/useAgents'
import { fetchIssues } from './api/agentService'
import MissionControl from './Dashboard'
import AgentRoster from './AgentRoster'
import Office from './Office'
import AgentDetail from './Detail'
import Issues from './Issues'

const TWEAK_DEFAULTS = {
  scanlines: true,
  showTorches: true,
  patrolSpeed: 1,
}

/** Target origin for postMessage. Use '*' only during local dev / same-origin iframe. */
const PM_ORIGIN = import.meta.env.VITE_PARENT_ORIGIN || window.location.origin || '*'

/* ── URL ↔ view mapping ─────────────────────────────────────────────── */

const VIEW_TO_PATH = {
  dashboard: '/dashboard',
  agents:    '/agents',
  missions:  '/issues',
  office:    '/tower',
  detail:    '/agent',       // + /:id
  memory:    '/memory',
  settings:  '/settings',
}

function pathToView(pathname) {
  if (pathname === '/' || pathname === '/dashboard') return { view: 'dashboard', activeId: null }
  if (pathname === '/agents')                    return { view: 'agents', activeId: null }
  if (pathname === '/issues')                    return { view: 'missions', activeId: null }
  if (pathname === '/tower')                     return { view: 'office', activeId: null }
  if (pathname === '/memory')                    return { view: 'memory', activeId: null }
  if (pathname === '/settings')                  return { view: 'settings', activeId: null }
  // /agent/:id
  const m = pathname.match(/^\/agent\/(.+)$/)
  if (m) return { view: 'detail', activeId: m[1] }
  // fallback
  return { view: 'dashboard', activeId: null }
}

/* ── Sidebar ────────────────────────────────────────────────────────── */

function Sidebar({ view, goTo, agentCount, inProgressCount }) {
  const NavItem = ({ id, icon, label, badge }) => {
    const isActive = view === id
    return (
      <button
        className={`nav-item ${isActive ? 'active' : ''}`}
        onClick={() => goTo(id)}
        aria-current={isActive ? 'page' : undefined}
      >
        <span className="ico" aria-hidden="true">{icon}</span>
        <span>{label}</span>
        {badge != null && <span className={`badge ${typeof badge === 'number' && badge > 0 ? 'pulse' : ''}`}>{badge}</span>}
      </button>
    )
  }

  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="brand-block">
        <div className="brand-mark" aria-hidden="true"></div>
        <div className="brand-text">
          <div className="brand-name">HERMOSO RESEARCH</div>
          <div className="brand-sub">Agent Orchestration</div>
        </div>
      </div>

      <nav aria-label="Overview">
        <div className="nav-section">
          <div className="nav-heading">Overview</div>
          <NavItem id="dashboard" icon="◧" label="Dashboard" badge={inProgressCount} />
          <NavItem id="agents" icon="⬢" label="Agents" badge={agentCount} />
        </div>
      </nav>

      <nav aria-label="Operations">
        <div className="nav-section">
          <div className="nav-heading">Operations</div>
          <NavItem id="missions" icon="▷" label="Issues" badge={inProgressCount > 0 ? inProgressCount : null} />
          <NavItem id="office" icon="✦" label="The Tower" />
          <NavItem id="memory" icon="◌" label="Memory Graph" />
        </div>
      </nav>

      <nav aria-label="System">
        <div className="nav-section">
          <div className="nav-heading">System</div>
          <NavItem id="settings" icon="⚙" label="Settings" />
        </div>
      </nav>

      <div className="sidebar-foot">
        <div className="avatar" aria-hidden="true"></div>
        <div>
          <div className="name">Pilot</div>
          <div className="role">Commander</div>
        </div>
      </div>
    </aside>
  )
}

/* ── ErrorBoundary ──────────────────────────────────────────────────── */

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-dim)' }}>
          <h2 style={{ color: 'var(--red)' }}>⚠ Something went wrong</h2>
          <p style={{ marginTop: 12 }}>{this.state.error?.message || 'Unknown error'}</p>
          <button
            className="btn primary"
            style={{ marginTop: 24 }}
            onClick={() => window.location.reload()}
          >Reload Page</button>
        </div>
      )
    }
    return this.props.children
  }
}

/* ── App ────────────────────────────────────────────────────────────── */

export default function App() {
  // Initialize view from current URL
  const initial = pathToView(window.location.pathname)
  const [view, setView] = useState(initial.view)
  const [activeId, setActiveId] = useState(initial.activeId)
  const [tweaksOpen, setTweaksOpen] = useState(false)
  const [tweaks, setTweaks] = useState(TWEAK_DEFAULTS)

  // Realtime polling from Paperclip API (every 3s)
  const { agents, loading, error, lastUpdated, refresh } = useAgents(3000)

  // Poll in-progress issues count for sidebar badge
  const [inProgressCount, setInProgressCount] = useState(0)
  useEffect(() => {
    let cancelled = false
    async function countInProgress() {
      try {
        const data = await fetchIssues()
        if (cancelled) return
        const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
        const count = list.filter((i) => {
          const s = (i.status ?? '').toString().toLowerCase().replace(/[-_\s]/g, '')
          return s === 'inprogress' || s === 'in_progress' || s.includes('progress')
        }).length
        setInProgressCount(count)
      } catch { /* ignore */ }
    }
    countInProgress()
    const id = setInterval(countInProgress, 3000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  // Listen for browser back/forward
  useEffect(() => {
    const onPop = () => {
      const { view: v, activeId: id } = pathToView(window.location.pathname)
      setView(v)
      setActiveId(id)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === '__activate_edit_mode') setTweaksOpen(true)
      if (e.data?.type === '__deactivate_edit_mode') setTweaksOpen(false)
    }
    window.addEventListener('message', handler)
    window.parent.postMessage({ type: '__edit_mode_available' }, PM_ORIGIN)
    return () => window.removeEventListener('message', handler)
  }, [])

  const setTweak = (k, v) => {
    setTweaks((prev) => ({ ...prev, [k]: v }))
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [k]: v } }, PM_ORIGIN)
  }

  const open = (id) => {
    setActiveId(id)
    setView('detail')
    window.history.pushState(null, '', `/agent/${id}`)
    window.scrollTo(0, 0)
  }

  const goTo = (v) => {
    setView(v)
    setActiveId(null)
    const path = VIEW_TO_PATH[v] || '/dashboard'
    window.history.pushState(null, '', path)
    window.scrollTo(0, 0)
  }

  const back = () => {
    setView('agents')
    setActiveId(null)
    window.history.pushState(null, '', '/agents')
    window.scrollTo(0, 0)
  }

  const active = agents.find((a) => a.id === activeId)
  const sidebarActive = view === 'detail' ? 'agents' : view

  return (
    <div className="app">
      <Sidebar view={sidebarActive} goTo={goTo} agentCount={agents.length} inProgressCount={inProgressCount} />

      <ErrorBoundary>
        <main>
          {view === 'dashboard' && (
            <MissionControl
              agents={agents}
              onOpenAgent={open}
              loading={loading}
              error={error}
              lastUpdated={lastUpdated}
              onRefresh={refresh}
            />
          )}
          {view === 'agents' && (
            <AgentRoster
              agents={agents}
              onOpenAgent={open}
              loading={loading}
              error={error}
              lastUpdated={lastUpdated}
              onRefresh={refresh}
            />
          )}
          {view === 'missions' && <Issues />}
          {view === 'office' && (
            <Office
              agents={agents}
              onOpenAgent={open}
              loading={loading}
              error={error}
              lastUpdated={lastUpdated}
              onRefresh={refresh}
            />
          )
          }
          {view === 'detail' && active && (
            <AgentDetail agent={active} agents={agents} onOpenAgent={open} onBack={back} />
          )}
        </main>
      </ErrorBoundary>

      {view === 'agents' && (
        <button
          className="btn primary"
          style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 50 }}
          onClick={() => goTo('office')}
        >✦ Enter Tower</button>
      )}

      {tweaksOpen && (
        <div className="tweaks-fab">
          <h4>
            <span>◆ Tweaks</span>
            <button
              aria-label="Close tweaks"
              onClick={() => { setTweaksOpen(false); window.parent.postMessage({ type: '__edit_mode_dismissed' }, PM_ORIGIN) }}
            >×</button>
          </h4>
          <div className="tweak-row">
            <span>CRT Scanlines (Tower)</span>
            <input type="checkbox" checked={tweaks.scanlines} onChange={(e) => setTweak('scanlines', e.target.checked)} />
          </div>
          <div className="tweak-row">
            <span>Show Torches</span>
            <input type="checkbox" checked={tweaks.showTorches} onChange={(e) => setTweak('showTorches', e.target.checked)} />
          </div>
          <div className="tweak-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
            <span>Patrol Speed: {tweaks.patrolSpeed}x</span>
            <input type="range" min="0.5" max="3" step="0.5" value={tweaks.patrolSpeed} onChange={(e) => setTweak('patrolSpeed', +e.target.value)} />
          </div>
        </div>
      )}
    </div>
  )
}
