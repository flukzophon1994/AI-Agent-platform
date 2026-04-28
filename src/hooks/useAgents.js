import { useState, useEffect, useRef, useCallback } from 'react'
import { AGENTS } from '../agents'
import { fetchAgentsIndividual } from '../api/agentService'

function mergeApiWithLocal(apiList) {
  if (!Array.isArray(apiList)) return AGENTS

  // If already merged by fetchAgentsIndividual, return as-is
  if (apiList.length > 0 && apiList[0].apiData?.uuid && apiList[0].skills) {
    return apiList
  }

  // Build a lookup from API UUID → our local agent
  const localByUuid = new Map()
  AGENTS.forEach((a) => {
    if (a.apiData?.uuid) localByUuid.set(a.apiData.uuid, a)
  })

  return apiList.map((api) => {
    const local = localByUuid.get(api.id)
    if (!local) {
      // Agent ใหม่ที่ยังไม่มีใน local — สร้าง shape พื้นฐาน
      return {
        id: api.urlKey || api.id,
        name: api.name,
        title: api.title || api.role,
        sprite: api.icon || 'baphomet',
        platform: api.adapterType || 'Hermes AI',
        level: api.role === 'ceo' ? 999 : 50,
        class: 'Agent',
        status: api.status || 'idle',
        task: api.capabilities ? api.capabilities.slice(0, 120) + '…' : '—',
        hp: 80,
        mp: 70,
        tokens: 0.5,
        tokenLimit: 2.0,
        skills: [],
        tools: [],
        relations: [],
        memory: [],
        convo: [],
        series: Array.from({ length: 12 }, () => 70 + Math.floor(Math.random() * 25)),
        apiData: api,
      }
    }

    // Merge API ข้อมูลใหม่ล่าสุดเข้ากับ local shape
    return {
      ...local,
      status: api.status || local.status,
      task: api.capabilities ? api.capabilities.slice(0, 160) + (api.capabilities.length > 160 ? '…' : '') : local.task,
      apiData: { ...local.apiData, ...api },
    }
  })
}

/**
 * useAgents — realtime polling hook for Paperclip API.
 *
 * Returns:
 *   agents      — merged array (API data + local UI shape)
 *   loading     — true on first fetch
 *   error       — error message if last fetch failed
 *   lastUpdated — ISO timestamp of last successful fetch
 *   refresh()   — manual refetch function
 */
export default function useAgents(pollMs = 5000) {
  const [agents, setAgents] = useState(AGENTS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const timerRef = useRef()

  const refresh = useCallback(async () => {
    try {
      const apiList = await fetchAgentsIndividual()
      const merged = mergeApiWithLocal(apiList)
      setAgents(merged)
      setError(null)
      setLastUpdated(new Date().toISOString())
    } catch (err) {
      setError(err.message)
      // keep previous agents on error
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh() // initial fetch
    timerRef.current = setInterval(refresh, pollMs)
    return () => clearInterval(timerRef.current)
  }, [refresh, pollMs])

  return { agents, loading, error, lastUpdated, refresh }
}
