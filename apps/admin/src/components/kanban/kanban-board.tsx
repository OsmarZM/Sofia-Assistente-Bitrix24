'use client'

import { DndContext, type DragEndEvent, DragOverlay, closestCorners } from '@dnd-kit/core'
import { useEffect, useState } from 'react'
import { KanbanColumn, KanbanCard } from './kanban-column'
import { ConversationDrawer } from './conversation-drawer'
import { apiClient, type Session, type Phase } from '../../lib/api'
import { useKanban } from '../../hooks/use-kanban'

type KanbanBoardProps = {
  initialSessions: Session[]
  phases: Phase[]
}

export function KanbanBoard({ initialSessions, phases }: KanbanBoardProps) {
  const { sessions, setSessions, dragging, setDragging, moveSession } = useKanban(initialSessions)
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)

  // Polling de sessões a cada 5s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const fresh = await apiClient.sessions.live(5)
        setSessions((prev) => {
          const map = new Map(prev.map((s) => [s.id, s]))
          for (const s of fresh) map.set(s.id, s)
          return Array.from(map.values())
        })
      } catch { /* */ }
    }, 5000)
    return () => clearInterval(interval)
  }, [setSessions])

  function handleDragStart(event: { active: { id: string; data: { current?: { session: Session } } } }) {
    const session = event.active.data.current?.session ?? null
    setActiveSession(session)
    setDragging(event.active.id)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveSession(null)
    setDragging(null)

    const { active, over } = event
    if (!over || !active) return

    const toSlug = over.id as string
    const session = sessions.find((s) => s.id === active.id)
    if (!session || session.conversation_phases.slug === toSlug) return

    await moveSession(session.id, toSlug)
  }

  return (
    <>
      <DndContext
        collisionDetection={closestCorners}
        onDragStart={handleDragStart as never}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {phases.map((phase) => (
            <KanbanColumn
              key={phase.id}
              phase={phase}
              sessions={sessions.filter((s) => s.current_phase_id === phase.id)}
              onCardClick={(s) => setSelectedSession(s)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeSession && (
            <div className="rotate-2 opacity-90">
              <KanbanCard session={activeSession} onClick={() => {}} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {selectedSession && (
        <ConversationDrawer
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          onSessionUpdate={(updated) => {
            setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
            setSelectedSession(updated)
          }}
        />
      )}
    </>
  )
}
