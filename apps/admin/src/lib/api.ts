const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

// ── Types mínimos para o front ───────────────────────────────────────────────

export type Phase = {
  id: string
  name: string
  slug: string
  color: string
  order: number
}

export type Session = {
  id: string
  bitrix_user_id: string
  bitrix_dialog_id: string
  current_phase_id: string
  last_msg_at: string
  sofia_paused: boolean
  conversation_phases: Phase
  users: { name: string; photo_url?: string; position?: string }
}

export type Message = {
  id: string
  session_id: string
  role: 'user' | 'assistant' | 'admin_as_sofia'
  content: string
  created_at: string
  confidence?: number
  tokens_in?: number
  tokens_out?: number
  cost_usd?: number
  latency_ms?: number
  cache_hit?: boolean
  feedback?: 'positive' | 'negative' | null
}

export type DashboardMetrics = {
  period: string
  messages: { total: number; today: number }
  sessions: { active: number }
  cost: { usd: number; tokensIn: number; tokensOut: number }
  cache: { hitRate: number; hits: number }
  quality: { answerRate: number; noAnswerCount: number }
  budgets: Array<{ period: string; limit_usd: number; current_usd: number; alert_threshold_pct: number }>
  alerts: Array<{ id: string; type: string; message: string; severity: string; created_at: string }>
  suggestions: { pending: number }
}

export type CostChartPoint = {
  date: string
  costUsd: number
  tokensIn: number
  tokensOut: number
}

// ── API calls ────────────────────────────────────────────────────────────────

export const apiClient = {
  sessions: {
    list: (params?: { phase?: string; open?: boolean }) => {
      const q = new URLSearchParams()
      if (params?.phase) q.set('phase', params.phase)
      if (params?.open) q.set('open', 'true')
      return api<Session[]>(`/admin/sessions?${q}`)
    },
    live: (since = 10) => api<Session[]>(`/admin/sessions/live?since=${since}`),
    messages: (sessionId: string) => api<Message[]>(`/admin/sessions/${sessionId}/messages`),
    movePhase: (sessionId: string, to_slug: string) =>
      api(`/admin/sessions/${sessionId}/phase`, {
        method: 'POST',
        body: JSON.stringify({ to_slug }),
      }),
    pause: (sessionId: string, paused: boolean) =>
      api(`/admin/sessions/${sessionId}/pause`, {
        method: 'POST',
        body: JSON.stringify({ paused, admin_id: 'admin' }),
      }),
    sendMessage: (sessionId: string, content: string, bitrix_chat_id: string) =>
      api(`/admin/sessions/${sessionId}/message`, {
        method: 'POST',
        body: JSON.stringify({ content, admin_id: 'admin', bitrix_chat_id }),
      }),
  },
  messages: {
    feedback: (messageId: string, feedback: 'positive' | 'negative') =>
      api(`/admin/messages/${messageId}/feedback`, {
        method: 'POST',
        body: JSON.stringify({ feedback }),
      }),
  },
  dashboard: {
    metrics: (period = '7d') => api<DashboardMetrics>(`/admin/dashboard/metrics?period=${period}`),
    costChart: (days = 7) => api<CostChartPoint[]>(`/admin/dashboard/cost-chart?days=${days}`),
  },
  alerts: {
    acknowledge: (alertId: string) =>
      api(`/admin/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        body: JSON.stringify({ admin_id: 'admin' }),
      }),
  },
  providers: {
    list: () => api<unknown[]>('/admin/providers'),
  },
  documents: {
    list: () => api<unknown[]>('/admin/documents'),
    create: (data: unknown) =>
      api('/admin/documents', { method: 'POST', body: JSON.stringify(data) }),
  },
  suggestions: {
    pending: () => api<unknown[]>('/admin/suggestions'),
    approve: (id: string) =>
      api(`/admin/suggestions/${id}/approve`, { method: 'POST', body: JSON.stringify({ reviewer_id: 'admin' }) }),
    reject: (id: string) =>
      api(`/admin/suggestions/${id}/reject`, { method: 'POST', body: JSON.stringify({ reviewer_id: 'admin' }) }),
  },
}
