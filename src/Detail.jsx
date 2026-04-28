import { useState } from 'react'
import { COLORS, RARITY, STATUS_LABEL, RELATION_GRAD, initials, StarRow } from './constants.jsx'
import { INSTRUCTIONS } from './agentInstructions'

function MarkdownBlock({ text }) {
  if (!text) return <div className="inst-body">No instructions defined.</div>
  const lines = text.split('\n')
  return (
    <div className="inst-md">
      {lines.map((line, i) => {
        const trimmed = line.trim()
        if (!trimmed) return <div key={i} style={{ height: 8 }} />
        if (trimmed.startsWith('# ')) return <h4 key={i} className="md-h1">{trimmed.slice(2)}</h4>
        if (trimmed.startsWith('## ')) return <h5 key={i} className="md-h2">{trimmed.slice(3)}</h5>
        if (trimmed.startsWith('### ')) return <h6 key={i} className="md-h3">{trimmed.slice(4)}</h6>
        if (trimmed.startsWith('- ')) return <div key={i} className="md-li">• {trimmed.slice(2)}</div>
        if (trimmed.startsWith('**') && trimmed.endsWith('**')) return <div key={i} className="md-p"><strong>{trimmed.slice(2, -2)}</strong></div>
        return <div key={i} className="md-p">{trimmed}</div>
      })}
    </div>
  )
}

function PerfGraph({ series, color = '#b58aff' }) {
  const w = 600, h = 140
  const max = Math.max(...series, 100)
  const min = Math.min(...series, 0)
  const stepX = w / (series.length - 1)
  const points = series.map((v, i) => {
    const x = i * stepX
    const y = h - ((v - min) / (max - min)) * (h - 20) - 10
    return [x, y]
  })
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ')
  const areaD = `${pathD} L ${w} ${h} L 0 ${h} Z`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ height: 140 }}>
      <defs>
        <linearGradient id="grad-a" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1="0" x2={w} y1={(h / 3) * i} y2={(h / 3) * i} stroke="rgba(255,255,255,0.04)" />
      ))}
      <path d={areaD} fill="url(#grad-a)" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill={color} />
      ))}
    </svg>
  )
}


export default function AgentDetail({ agent, agents, onOpenAgent, onBack }) {
  const [tab, setTab] = useState('skills')
  const color = COLORS[agent.id] || 'violet'
  const rar = RARITY[agent.id] || { tier: 'SR', stars: 4 }

  return (
    <div className="main">
      <button className="back-btn" onClick={onBack}>← Back to Roster</button>

      <div className="detail-grid">
        <div className="detail-side">
          <div className="hero-card">
            <div className={`hero-grad card-grad ${color}`}>
              <div className="h-rarity rarity">
                <span className="label">{rar.tier}</span>
                <StarRow n={rar.stars} />
              </div>
              <div className="h-lvl lvl-pill">Lv {agent.level}</div>
              <div className="h-init">{initials(agent.name)}</div>
            </div>
            <div className="hero-foot">
              <h2>{agent.name}</h2>
              <div className="role">{agent.title} · {agent.class}</div>
              <span className="platform">{agent.platform}</span>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h3>Vital Signs</h3>
              <span className="meta">{STATUS_LABEL[agent.status]}</span>
            </div>
            <div className="vital-list">
              <div className="vital">
                <span className="v-lbl">CTX</span>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${agent.hp}%`, background: 'linear-gradient(90deg,#ff5c7a,#ff9966)' }}></div></div>
                <span className="v-val">{agent.hp}%</span>
              </div>
              <div className="vital">
                <span className="v-lbl">MEM</span>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${agent.mp}%`, background: 'linear-gradient(90deg,#4ce0a0,#6fe6f0)' }}></div></div>
                <span className="v-val">{agent.mp}%</span>
              </div>
              <div className="vital">
                <span className="v-lbl">TOK</span>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${(agent.tokens / agent.tokenLimit) * 100}%`, background: 'linear-gradient(90deg,#b58aff,#d4b6ff)' }}></div></div>
                <span className="v-val">{agent.tokens}M/{agent.tokenLimit}M</span>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h3>Current Task</h3>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.55 }}>
              {agent.task}
            </div>
          </div>
        </div>

        <div className="detail-main" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="tabs">
            {[['skills','Skills'],['memory','Memory'],['tools','Tools'],['relations','Relations'],['log','Conversation'],['perf','Performance']].map(([k, l]) => (
              <button key={k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button>
            ))}
          </div>

          {tab === 'skills' && (
            <>
              <div className="panel">
                <div className="panel-head">
                  <h3>Skill Tree</h3>
                  <span className="meta">{agent.skills.filter((s) => s.state === 'maxed').length} maxed · {agent.skills.filter((s) => s.state === 'unlocked').length} active</span>
                </div>
                <div className="skill-grid">
                  {agent.skills.map((s, i) => (
                    <div key={i} className={`skill ${s.state}`}>
                      <div className="s-icon">{s.icon}</div>
                      <div className="s-name">{s.name}</div>
                      <div className="s-bar"><div className="s-fill" style={{ width: `${(s.lvl / s.max) * 100}%` }}></div></div>
                      <div className="s-lvl">LV <strong>{s.lvl}</strong> / {s.max}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel">
                <div className="panel-head">
                  <h3>AGENTS.md</h3>
                  <span className="meta">{agent.apiData?.adapterConfig?.instructionsEntryFile || 'AGENTS.md'}</span>
                </div>
                <MarkdownBlock text={INSTRUCTIONS[agent.id]} />
              </div>

              <div className="panel">
                <div className="panel-head">
                  <h3>API Config</h3>
                  <span className="meta">Paperclip runtime</span>
                </div>
                <div className="inst-grid">
                  <div className="inst-row">
                    <span className="inst-lbl">Adapter</span>
                    <span className="inst-val">{agent.apiData?.adapterType || '—'}</span>
                  </div>
                  <div className="inst-row">
                    <span className="inst-lbl">Model</span>
                    <span className="inst-val">{agent.apiData?.adapterConfig?.model || '—'}</span>
                  </div>
                  <div className="inst-row">
                    <span className="inst-lbl">Instructions Path</span>
                    <span className="inst-val mono" style={{ fontSize: 10 }}>{agent.apiData?.adapterConfig?.instructionsRootPath || '—'}</span>
                  </div>
                  <div className="inst-row">
                    <span className="inst-lbl">Entry File</span>
                    <span className="inst-val mono" style={{ fontSize: 10 }}>{agent.apiData?.adapterConfig?.instructionsEntryFile || '—'}</span>
                  </div>
                  <div className="inst-row">
                    <span className="inst-lbl">Bundle Mode</span>
                    <span className="inst-val">{agent.apiData?.adapterConfig?.instructionsBundleMode || '—'}</span>
                  </div>
                  <div className="inst-row">
                    <span className="inst-lbl">Heartbeat</span>
                    <span className="inst-val">{agent.apiData?.runtimeConfig?.heartbeat?.enabled ? 'ON' : 'OFF'} {agent.apiData?.runtimeConfig?.heartbeat?.intervalSec ? `· ${agent.apiData.runtimeConfig.heartbeat.intervalSec}s` : ''}</span>
                  </div>
                  <div className="inst-row">
                    <span className="inst-lbl">Max Turns</span>
                    <span className="inst-val">{agent.apiData?.adapterConfig?.maxTurnsPerRun ?? '—'}</span>
                  </div>
                  <div className="inst-row">
                    <span className="inst-lbl">Budget</span>
                    <span className="inst-val">{agent.apiData?.budgetMonthlyCents ? `$${(agent.apiData.budgetMonthlyCents / 100).toFixed(2)}/mo` : '—'}</span>
                  </div>
                  <div className="inst-row">
                    <span className="inst-lbl">Spent</span>
                    <span className="inst-val">{agent.apiData?.spentMonthlyCents ? `$${(agent.apiData.spentMonthlyCents / 100).toFixed(2)}` : '—'}</span>
                  </div>
                  <div className="inst-row">
                    <span className="inst-lbl">Can Create Agents</span>
                    <span className="inst-val">{agent.apiData?.permissions?.canCreateAgents ? 'YES' : 'NO'}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === 'memory' && (
            <div className="panel">
              <div className="panel-head">
                <h3>Long-term Memory</h3>
                <span className="meta">{agent.memory.length} entries</span>
              </div>
              <div className="memory-list">
                {agent.memory.map((m, i) => (
                  <div key={i} className="memory-entry">
                    <div className="m-head">
                      <span className="m-tag">[{m.tag}]</span>
                      <span className="m-time">{m.time} ago</span>
                    </div>
                    <div className="m-body">{m.body}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'tools' && (
            <div className="panel">
              <div className="panel-head">
                <h3>Equipped Tools</h3>
                <span className="meta">{agent.tools.length} bound</span>
              </div>
              <div className="tools-grid">
                {agent.tools.map((t, i) => (
                  <div key={i} className="tool-slot">
                    <div className="t-icon">{t.icon}</div>
                    <div>
                      <div className="t-name">{t.name}</div>
                      <div className="t-meta">{t.meta}</div>
                    </div>
                  </div>
                ))}
                {Array.from({ length: Math.max(0, 9 - agent.tools.length) }).map((_, i) => (
                  <div key={`e${i}`} className="tool-slot empty">
                    <div className="t-icon">—</div>
                    <div>
                      <div className="t-name" style={{ color: 'var(--text-muted)' }}>empty slot</div>
                      <div className="t-meta">unbound</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'relations' && (
            <div className="panel">
              <div className="panel-head">
                <h3>Relationships</h3>
                <span className="meta">who {agent.name} talks to</span>
              </div>
              <div className="relations">
                {agent.relations.map((r, i) => {
                  const tgt = agents.find((a) => a.sprite === r.sprite)
                  const c = COLORS[tgt?.id] || 'violet'
                  return (
                    <div key={i} className="relation" onClick={() => tgt && onOpenAgent(tgt.id)}>
                      <div className="r-mini" style={{ background: RELATION_GRAD[c] }}>
                        {tgt ? initials(tgt.name) : '?'}
                      </div>
                      <span className="r-name">{r.name}</span>
                      <span className="r-type">{r.type}</span>
                      <span className="r-count">{r.count} msgs</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {tab === 'log' && (
            <div className="panel">
              <div className="panel-head">
                <h3>Conversation Log</h3>
                <span className="meta">last {agent.convo.length}</span>
              </div>
              <div className="convo">
                {agent.convo.map((c, i) => (
                  <div key={i} className={`convo-msg ${c.who}`}>
                    <span className="c-time">{c.t}</span>
                    <span className="c-tag">{c.who === 'in' ? 'USER' : c.who === 'out' ? 'AGENT' : 'SYS'}</span>
                    <span className="c-body">{c.body}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'perf' && (
            <div className="panel">
              <div className="panel-head">
                <h3>Performance · Last 12 Hours</h3>
              </div>
              <div className="graph">
                <PerfGraph series={agent.series} color="#b58aff" />
                <div className="legend">
                  <span>● Throughput score</span>
                  <span>min {Math.min(...agent.series)} · max {Math.max(...agent.series)}</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16 }}>
                <div className="stat-tile" style={{ padding: 14 }}>
                  <div className="label">Tasks · 24h</div>
                  <div className="value" style={{ fontSize: 22 }}>{42 + agent.level % 30}</div>
                </div>
                <div className="stat-tile green" style={{ padding: 14 }}>
                  <div className="label">Success rate</div>
                  <div className="value green" style={{ fontSize: 22 }}>{(94 + agent.level % 6)}%</div>
                </div>
                <div className="stat-tile" style={{ padding: 14 }}>
                  <div className="label">Avg latency</div>
                  <div className="value" style={{ fontSize: 22, color: 'var(--cyan)' }}>{(0.8 + (agent.level % 7) / 10).toFixed(1)}s</div>
                </div>
                <div className="stat-tile red" style={{ padding: 14 }}>
                  <div className="label">Tokens · 24h</div>
                  <div className="value red" style={{ fontSize: 22 }}>{(agent.tokens * 1000).toFixed(0)}k</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
