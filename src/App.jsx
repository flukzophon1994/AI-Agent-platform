import { useState, useEffect, Component } from 'react'
import useAgents from './hooks/useAgents'
import MissionControl from './Dashboard'
import Office from './Office'
import AgentDetail from './Detail'

const TWEAK_DEFAULTS = {
  scanlines: true,
  showTorches: true,
  patrolSpeed: 1,
}

/** Target origin for postMessage. Use '*' only during local dev / same-origin iframe. */
const PM_ORIGIN = import.meta.env.VITE_PARENT_ORIGIN || window.location.origin || '*'

function Sidebar({ view, goTo, agentCount }) {
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
        {badge != null && <span className="badge">{badge}</span>}
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
          <NavItem id="dashboard" icon="◧" label="Dashboard" />
          <NavItem id="mission" icon="⬢" label="Agents" badge={agentCount} />
        </div>
      </nav>

      <nav aria-label="Operations">
        <div className="nav-section">
          <div className="nav-heading">Operations</div>
          <NavItem id="missions" icon="▷" label="Mission Log" badge="●" />
          <NavItem id="office" icon="✦" label="The Tower" />
          <NavItem id="skills" icon="✚" label="Skills" />
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

export default function App() {
  const [view, setView] = useState('mission')
  const [activeId, setActiveId] = useState(null)
  const [tweaksOpen, setTweaksOpen] = useState(false)
  const [tweaks, setTweaks] = useState(TWEAK_DEFAULTS)

  // Realtime polling from Paperclip API (every 5s)
  const { agents, loading, error, lastUpdated, refresh } = useAgents(5000)

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

  const open = (id) => { setActiveId(id); setView('detail'); window.scrollTo(0, 0) }
  const goTo = (v) => {
    const map = { dashboard: 'mission', missions: 'mission', skills: 'mission', memory: 'mission', settings: 'mission' }
    setView(map[v] || v)
    window.scrollTo(0, 0)
  }
  const back = () => { setView('mission'); window.scrollTo(0, 0) }

  const active = agents.find((a) => a.id === activeId)
  const sidebarActive = view === 'detail' ? 'mission' : view

  return (
    <div className="app">
      <Sidebar view={sidebarActive} goTo={goTo} agentCount={agents.length} />

      <ErrorBoundary>
        <main>
          {view === 'mission' && (
            <MissionControl
              agents={agents}
              onOpenAgent={open}
              loading={loading}
              error={error}
              lastUpdated={lastUpdated}
              onRefresh={refresh}
            />
          )}
          {view === 'office' && (
            <Office
              agents={agents}
              onOpenAgent={open}
              loading={loading}
              error={error}
              lastUpdated={lastUpdated}
              onRefresh={refresh}
            />
          )}
          {view === 'detail' && active && (
            <AgentDetail agent={active} agents={agents} onOpenAgent={open} onBack={back} />
          )}
        </main>
      </ErrorBoundary>

      {view === 'mission' && (
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
