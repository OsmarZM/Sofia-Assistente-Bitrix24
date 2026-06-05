'use client'

import { useState, useCallback } from 'react'
import { apiClient, type Session, type Message } from '../../lib/api'

export function useKanban(initialSessions: Session[]) {
  const [sessions, setSessions] = useState<Session[]>(initialSessions)
  const [dragging, setDragging] = useState<string | null>(null)

  const moveSession = useCallback(async (sessionId: string, toSlug: string) => {
    // Optimistic update
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              conversation_phases: {
                ...s.conversation_phases,
                slug: toSlug,
              },
            }
          : s
      )
    )
    try {
      await apiClient.sessions.movePhase(sessionId, toSlug)
    } catch {
      // Reverte em falha (recarrega)
      const fresh = await apiClient.sessions.list({ open: true })
      setSessions(fresh)
    }
  }, [])

  return { sessions, setSessions, dragging, setDragging, moveSession }
}

export function useConversation(sessionId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!sessionId) return
    setLoading(true)
    try {
      const msgs = await apiClient.sessions.messages(sessionId)
      setMessages(msgs)
    } catch { /* */ } finally {
      setLoading(false)
    }
  }, [sessionId])

  return { messages, loading, load }
}
