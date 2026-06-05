'use client'

import { useDraggable, useDroppable } from '@dnd-kit/core'
import { Bot, User, Clock, ThumbsUp, ThumbsDown, Pause, Play } from 'lucide-react'
import { cn, formatRelativeTime, confidenceBg } from '../../lib/utils'
import type { Session, Phase } from '../../lib/api'

// ── KanbanColumn ─────────────────────────────────────────────────────────────

type KanbanColumnProps = {
  phase: Phase
  sessions: Session[]
  onCardClick: (session: Session) => void
}

export function KanbanColumn({ phase, sessions, onCardClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: phase.slug })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col min-w-[280px] max-w-[280px] bg-gray-900 rounded-xl border transition-colors',
        isOver ? 'border-brand-500/60 bg-brand-950/20' : 'border-gray-800'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: phase.color }}
          />
          <span className="font-semibold text-sm text-gray-200">{phase.name}</span>
        </div>
        <span className="text-xs font-bold text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
          {sessions.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 p-2 min-h-[120px]">
        {sessions.map((session) => (
          <KanbanCard
            key={session.id}
            session={session}
            onClick={() => onCardClick(session)}
          />
        ))}
      </div>
    </div>
  )
}

// ── KanbanCard ────────────────────────────────────────────────────────────────

type KanbanCardProps = {
  session: Session
  onClick: () => void
}

export function KanbanCard({ session, onClick }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: session.id,
    data: { session },
  })

  const user = session.users

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'flex flex-col gap-2 p-3 bg-gray-800 rounded-lg border cursor-pointer select-none',
        'hover:border-gray-600 hover:bg-gray-750 transition-all',
        isDragging && 'opacity-50 border-brand-500',
        session.sofia_paused && 'border-yellow-600/40',
        !isDragging && 'border-gray-700'
      )}
    >
      {/* User row */}
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-600/20 border border-brand-600/30 flex-shrink-0 text-sm font-bold text-brand-400">
          {user?.name?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-100 truncate">{user?.name ?? 'Usuário'}</p>
          {user?.position && (
            <p className="text-xs text-gray-500 truncate">{user.position}</p>
          )}
        </div>
        {session.sofia_paused && (
          <Pause className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          {formatRelativeTime(session.last_msg_at)}
        </div>
      </div>
    </div>
  )
}
