'use client'

import { useEffect, useRef, useState } from 'react'
import { apiClient, type DashboardMetrics, type CostChartPoint, type Session } from '../../lib/api'

export function useDashboardMetrics(period = '7d') {
  const [data, setData] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const metrics = await apiClient.dashboard.metrics(period)
        if (!cancelled) setData(metrics)
      } catch { /* silent */ } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [period])

  return { data, loading }
}

export function useCostChart(days = 7) {
  const [data, setData] = useState<CostChartPoint[]>([])

  useEffect(() => {
    apiClient.dashboard.costChart(days).then(setData).catch(() => {})
  }, [days])

  return data
}

export function useLiveSessions(pollingMs = 5000) {
  const [sessions, setSessions] = useState<Session[]>([])
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const fetch = () => {
      apiClient.sessions
        .live(pollingMs / 1000)
        .then((s) => setSessions((prev) => {
          const map = new Map(prev.map((x) => [x.id, x]))
          for (const sess of s) map.set(sess.id, sess)
          return Array.from(map.values())
        }))
        .catch(() => {})
    }
    fetch()
    timer.current = setInterval(fetch, pollingMs)
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [pollingMs])

  return sessions
}
