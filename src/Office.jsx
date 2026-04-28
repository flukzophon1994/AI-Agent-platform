import { useEffect, useRef, forwardRef, useState } from 'react'
import BossSprite from './BossSprite'
import { AGENT_UUIDS } from './api/agentIds'
import { fetchAgentByUuid } from './api/agentService'

const FLOORS = [
  {
    num: 'F5',
    label: 'Reception · Save Point',
    sub: 'Greeter & onboarding',
    wings: [{ side: 'full', ids: ['kafra'] }],
    torchCount: 4,
    h: 180,
  },
  {
    num: 'F4',
    label: 'Inner Sanctum',
    sub: 'Supreme Architect · Throne',
    wings: [{ side: 'full', ids: ['satanmorroc'] }],
    torchCount: 4,
    h: 240,
    spire: true,
  },
  {
    num: 'F3',
    label: 'Battle Hall',
    sub: 'Revenue (W) · Engineering (E)',
    wings: [
      { side: 'west', label: 'WEST WING', ids: ['valkyrie'] },
      { side: 'east', label: 'EAST WING', ids: ['thanatos'] },
    ],
    torchCount: 4,
    h: 200,
  },
  {
    num: 'F2',
    label: 'Working Floor',
    sub: 'Strategy & Ops · 8 chiefs · East & West wings',
    wings: [
      { side: 'west', label: 'WEST WING', ids: ['osiris', 'doppelganger', 'eddga', 'darklord'] },
      { side: 'east', label: 'EAST WING', ids: ['baphomet', 'amonra', 'samurai', 'turtle'] },
    ],
    torchCount: 6,
    h: 220,
  },
  {
    num: 'F1',
    label: 'Tower Gate',
    sub: 'Entrance · No agents · Visitors enter here',
    wings: [],
    torchCount: 4,
    h: 200,
    entrance: true,
  },
]

const LINES = {
  satanmorroc: ['Routing 14 objectives...', 'Tower nominal.', 'Reallocate tokens.', 'No deadlocks. Good.', 'Decree issued.'],
  baphomet: ['Synthesizing strategy...', 'Hmm. Numbers look soft.', 'Where is the team?', 'Schedule the all-hands.', 'Send to the board.'],
  darklord: ['Inbox at zero.', 'Calendar locked.', 'Briefing draft v3.', 'Declining that hold.', 'Compiling notes...'],
  amonra: ['Burn down -4% MoM ☀', 'Forecasting Q3...', 'Sheet updated.', 'Need vendor quote.', 'Numbers checked.'],
  thanatos: ['INCIDENT! P1!', 'Killing query...', 'CPU dropping. 41%.', 'Postmortem incoming.', 'On-call active.'],
  kafra: ['Welcome, traveler!', 'Save point reached.', 'Offer letter draft v2.', 'L. Chen pipeline strong.', 'Onboarding queued.'],
  valkyrie: ['ACME at 80% close.', 'Forecast: $1.4M Q3.', 'Demo prepped.', 'Verbal yes received.', 'Battle-cry the team.'],
  osiris: ['Reading 84 sources...', 'Citations bound.', 'Truth sieved.', 'Synthesis ready.', 'Eternity is patient.'],
  doppelganger: ['Sequence step 1 sent.', 'Reply rate: 6.8%.', 'Cloning persona...', '240 prospects loaded.', 'Mirror engaged.'],
  eddga: ['*roar* Variant 7 wins.', 'CTR +23% vs control.', 'Brand voice locked.', 'Launch in 5 days.', 'Cut the hype words.'],
  samurai: ['Honor in service.', 'Travel booked: SFO.', 'Reservation held.', 'Quiet step taken.', 'Bushido compels me.'],
  turtle: ['Slow is smooth.', 'Holding the line.', 'No tickets in queue.', 'SOP confirmed.', 'Standing post.'],
}

/**
 * Determine effective tower status from API data.
 * Priority: paused > running > idle
 * - paused: apiData.pausedAt is set OR apiData.status === 'paused'
 * - running: status === 'running'
 * - idle: everything else
 */
function towerStatus(agent) {
  const apiStatus = agent.apiData?.status || agent.status
  if (agent.apiData?.pausedAt || apiStatus === 'paused') return 'paused'
  if (apiStatus === 'running') return 'running'
  return 'idle'
}

const NPC = forwardRef(function NPC({ agent, x, y, dir, bubble, onClick }, ref) {
  const flip = dir < 0 ? 'scaleX(-1)' : 'scaleX(1)'
  const status = towerStatus(agent)
  return (
    <div
      ref={ref}
      className="npc"
      style={{ left: x, bottom: y }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.() }}
      aria-label={`Open ${agent.name} profile`}
    >
      {bubble && <div className="bubble">{bubble}</div>}
      <div className={`npc-pip ${status}`}></div>
      <div className="npc-name">{agent.name}</div>
      <div className="npc-bob" style={{ transform: flip }}>
        <BossSprite which={agent.sprite} scale={agent.id === 'satanmorroc' ? 3 : 2} glow={agent.id === 'satanmorroc'} />
      </div>
    </div>
  )
})

function WingPatrol({ wing, agents, onOpenAgent }) {
  const containerRef = useRef(null)
  const rafRef = useRef()
  const npcRefs = useRef(new Map())
  const stateRef = useRef(
    wing.ids.map((id, i) => ({
      id,
      x: 50 + i * 90,
      dir: i % 2 === 0 ? 1 : -1,
      speed: 0.45 + Math.random() * 0.4,
      bubble: null,
      bubbleTimer: 1000 + Math.random() * 3000,
      waitTimer: 0,
    }))
  )

  useEffect(() => {
    let last = performance.now()
    const tick = (now) => {
      const dt = Math.min(64, now - last)
      last = now
      const w = containerRef.current ? containerRef.current.offsetWidth : 600
      const next = stateRef.current.map((s) => {
        const agent = agents.find((a) => a.id === s.id)
        if (!agent) return s
        let { x, dir, speed, bubble, bubbleTimer, waitTimer } = s

        // Always walk — regardless of status
        if (waitTimer > 0) {
          waitTimer -= dt
        } else {
          x += dir * speed * (dt / 16)
          if (Math.random() < 0.0015) waitTimer = 600 + Math.random() * 1500
        }
        const margin = 24
        if (x < margin) { x = margin; dir = 1 }
        if (x > w - margin - 70) { x = w - margin - 70; dir = -1 }
        if (Math.random() < 0.001) dir = -dir

        bubbleTimer -= dt
        if (bubbleTimer <= 0) {
          if (bubble) {
            bubble = null
            bubbleTimer = 4000 + Math.random() * 6000
          } else {
            const lines = LINES[s.id] || ['...']
            bubble = lines[Math.floor(Math.random() * lines.length)]
            bubbleTimer = 2500 + Math.random() * 1500
          }
        }
        return { ...s, x, dir, speed, bubble, bubbleTimer, waitTimer }
      })
      stateRef.current = next

      // Update DOM directly — no React re-render per frame
      next.forEach((s) => {
        const el = npcRefs.current.get(s.id)
        if (!el) return
        el.style.left = `${s.x}px`
        const bob = el.querySelector('.npc-bob')
        if (bob) bob.style.transform = `scaleX(${s.dir < 0 ? -1 : 1})`
        const bubbleEl = el.querySelector('.bubble')
        if (bubbleEl) {
          bubbleEl.textContent = s.bubble || ''
          bubbleEl.style.display = s.bubble ? 'block' : 'none'
        }
        // Update status pip class from current agent data
        const agent = agents.find((a) => a.id === s.id)
        if (agent) {
          const pipEl = el.querySelector('.npc-pip')
          if (pipEl) {
            const newStatus = towerStatus(agent)
            if (pipEl.dataset.status !== newStatus) {
              pipEl.dataset.status = newStatus
              pipEl.className = `npc-pip ${newStatus}`
            }
          }
        }
      })

      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [agents])

  return (
    <div ref={containerRef} className={`wing wing-${wing.side}`}>
      {wing.label && <div className="wing-label">{wing.label}</div>}
      {wing.ids.map((id) => {
        const agent = agents.find((a) => a.id === id)
        if (!agent) return null
        const s = stateRef.current.find((st) => st.id === id) || { x: 0, dir: 1, bubble: null }
        return (
          <NPC
            key={id}
            ref={(el) => { if (el) npcRefs.current.set(id, el) }}
            agent={agent}
            x={s.x}
            y={20}
            dir={s.dir}
            bubble={s.bubble}
            onClick={() => onOpenAgent(id)}
          />
        )
      })}
    </div>
  )
}

function EntranceFloor({ floor }) {
  return (
    <div className="floor entrance" style={{ height: floor.h }}>
      <div className="floor-bg"></div>
      <div className="floor-floor"></div>
      <div className="floor-label">
        <span className="num">{floor.num}</span> · {floor.label}
        <span className="sub">// {floor.sub}</span>
      </div>

      {Array.from({ length: floor.torchCount }).map((_, ti) => {
        const left = `${(ti + 1) * (100 / (floor.torchCount + 1))}%`
        return (
          <div key={ti} className="torch" style={{ left }}>
            <div className="torch-mount"></div>
            <div className="torch-flame"></div>
          </div>
        )
      })}

      <div className="gate-row">
        <div className="gate left">
          <div className="gate-arch"></div>
          <div className="gate-door"></div>
          <div className="gate-rivets"></div>
          <div className="gate-handle"></div>
          <div className="gate-step"></div>
        </div>
        <div className="gate-pillar">
          <div className="pillar-cap"></div>
          <div className="pillar-body"></div>
          <div className="pillar-base"></div>
        </div>
        <div className="gate right">
          <div className="gate-arch"></div>
          <div className="gate-door"></div>
          <div className="gate-rivets"></div>
          <div className="gate-handle"></div>
          <div className="gate-step"></div>
        </div>
      </div>

      <div className="welcome-sign">
        <div className="ws-line">◆ HERMOSO TOWER ◆</div>
        <div className="ws-sub">PUSH · ENTER · DELIVER</div>
      </div>

      <div style={{
        position: 'absolute',
        bottom: 6, right: 14,
        fontFamily: 'Press Start 2P, monospace',
        fontSize: 7,
        color: 'rgba(212, 165, 72, 0.4)',
        lineHeight: 1.6,
        zIndex: 5,
        pointerEvents: 'none',
      }}>
        <div>{floor.num}.GATE = OPEN</div>
      </div>
    </div>
  )
}

function FloorPatrol({ floor, agents, onOpenAgent }) {
  if (floor.entrance) return <EntranceFloor floor={floor} />

  return (
    <div className={`floor ${floor.spire ? 'spire' : ''}`} style={{ height: floor.h }}>
      <div className="floor-bg"></div>
      <div className="floor-floor"></div>
      <div className="floor-label">
        <span className="num">{floor.num}</span> · {floor.label}
        <span className="sub">// {floor.sub}</span>
      </div>

      {Array.from({ length: floor.torchCount }).map((_, ti) => {
        const left = `${(ti + 1) * (100 / (floor.torchCount + 1))}%`
        return (
          <div key={ti} className="torch" style={{ left }}>
            <div className="torch-mount"></div>
            <div className="torch-flame"></div>
          </div>
        )
      })}

      <div className="wings">
        {floor.wings.map((wing, i) => (
          <>
            {i > 0 && <div key={`div-${i}`} className="wing-divider"></div>}
            <WingPatrol key={wing.side} wing={wing} agents={agents} onOpenAgent={onOpenAgent} />
          </>
        ))}
      </div>

      <div style={{
        position: 'absolute',
        bottom: 6, right: 14,
        fontFamily: 'Press Start 2P, monospace',
        fontSize: 7,
        color: 'rgba(212, 165, 72, 0.4)',
        lineHeight: 1.6,
        zIndex: 5,
        pointerEvents: 'none',
      }}>
        <div>{floor.num}.STATUS = OK</div>
      </div>
    </div>
  )
}

function timeAgo(iso) {
  if (!iso) return 'never'
  const diff = Date.now() - new Date(iso).getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 5) return 'just now'
  if (sec < 60) return `${sec}s`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h`
  return `${Math.floor(hr / 24)}d`
}

function isOnline(agent) {
  const hb = agent.apiData?.lastHeartbeatAt
  if (!hb) return false
  const diff = Date.now() - new Date(hb).getTime()
  return diff < 5 * 60 * 1000
}

function makeTowerFeed(agents) {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const t = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`

  const entries = []
  agents.forEach((a) => {
    const online = isOnline(a)
    const ts = towerStatus(a)
    const status = ts === 'paused' ? 'PAUSED' : ts === 'running' ? 'RUNNING' : online ? 'IDLE' : 'OFFLINE'
    const tone = ts === 'paused' ? 'red' : ts === 'running' ? 'blu' : online ? '' : 'red'
    entries.push({
      time: t(now),
      floor: getFloorForAgent(a.id),
      name: a.name.split(' ')[0],
      body: `status=${status} · adapter=${a.apiData?.adapterType || '—'} · hb=${a.apiData?.lastHeartbeatAt ? timeAgo(a.apiData.lastHeartbeatAt) : 'never'}`,
      tone,
    })
  })
  return entries
}

function getFloorForAgent(id) {
  const map = {
    satanmorroc: 'F4.spire', kafra: 'F5.recv',
    valkyrie: 'F3.west', thanatos: 'F3.east',
    baphomet: 'F2.east', amonra: 'F2.east',
    darklord: 'F2.west', osiris: 'F2.west',
    doppelganger: 'F2.west', eddga: 'F2.west',
    samurai: 'F2.east', turtle: 'F2.east',
  }
  return map[id] || 'F?.unk'
}

export default function Office({ agents, onOpenAgent, loading, error, lastUpdated, onRefresh }) {
  const [towerAgents, setTowerAgents] = useState(agents)
  const [towerPollTick, setTowerPollTick] = useState(Date.now())
  const agentsRef = useRef(agents)

  // Keep ref in sync with props
  useEffect(() => { agentsRef.current = agents }, [agents])

  // Poll each agent by UUID every 3 seconds
  useEffect(() => {
    let mounted = true

    const poll = async () => {
      const currentAgents = agentsRef.current
      try {
        const results = await Promise.all(
          Object.entries(AGENT_UUIDS).map(async ([localId, uuid]) => {
            try {
              const api = await fetchAgentByUuid(uuid, localId)
              const local = currentAgents.find((a) => a.id === localId)
              if (!local) return null
              return {
                ...local,
                status: api.status || local.status,
                task: api.capabilities ? api.capabilities.slice(0, 160) + (api.capabilities.length > 160 ? '…' : '') : local.task,
                apiData: { ...local.apiData, ...api },
              }
            } catch (err) {
              // eslint-disable-next-line no-console
              console.warn(`[Tower] fetch ${localId} failed:`, err.message)
              const local = currentAgents.find((a) => a.id === localId)
              return local || null
            }
          })
        )
        const valid = results.filter(Boolean)
        if (valid.length > 0 && mounted) {
          setTowerAgents(valid)
          setTowerPollTick(Date.now())
        }
      } catch (err) {
        // Keep existing data on total failure
      }
    }

    poll() // initial fetch
    const id = setInterval(poll, 3000)
    return () => { mounted = false; clearInterval(id) }
  }, []) // empty deps — runs once, uses ref for latest agents

  const activeCount = towerAgents.filter((a) => towerStatus(a) === 'running').length
  const pausedCount = towerAgents.filter((a) => towerStatus(a) === 'paused').length
  const onlineCount = towerAgents.filter(isOnline).length
  const feed = makeTowerFeed(towerAgents)

  return (
    <div className="main">
      <div className="page-head">
        <div className="page-title">
          <h1><span className="accent">The</span> Tower</h1>
          <div className="meta">
            8-bit agent office · {towerAgents.length} agents · {onlineCount} online
            <span className="mono" style={{ marginLeft: 8, color: 'var(--text-muted)' }}>
              · sync {timeAgo(towerPollTick)}
            </span>
          </div>
        </div>
        <div className="page-actions">
          <span className="pill"><span className="dot" style={{ background: '#4ce0a0' }}></span>{towerAgents.length - activeCount - pausedCount} IDLE</span>
          <span className="pill"><span className="dot" style={{ background: '#6fe6f0' }}></span>{activeCount} RUNNING</span>
          {pausedCount > 0 && <span className="pill"><span className="dot" style={{ background: '#ff5c7a' }}></span>{pausedCount} PAUSED</span>}
          <button className="btn ghost" onClick={onRefresh} disabled={loading}>
            {loading ? '⟳ Sync…' : '⟳ Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rt-banner err">
          <span>⚠ Tower link weak: {error} · showing cached patrols</span>
        </div>
      )}
      {!error && towerPollTick && (
        <div className="rt-banner ok">
          <span>● Tower link active · sync {timeAgo(towerPollTick)} · 3s tick</span>
        </div>
      )}

      <div className="tower-wrap scanlines">
        <div className="tower-head">
          <span>◆ HERMOSO TOWER · 5 FLOORS · {towerAgents.length} AGENTS · {onlineCount} ONLINE</span>
          <span className="right">SCALE 2X · TICK 3S</span>
        </div>

        {FLOORS.map((floor) => (
          <FloorPatrol key={floor.num} floor={floor} agents={towerAgents} onOpenAgent={onOpenAgent} />
        ))}

        <div className="tower-foot">
          {feed.slice(0, 8).map((f, i) => (
            <div key={i} className="row">
              [{f.time}] <span className="ag">{f.floor}</span> {f.name} {f.body}
              {f.tone === 'blu' && <span className="blu"> · running</span>}
              {f.tone === 'red' && <span className="red"> · paused/offline</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
