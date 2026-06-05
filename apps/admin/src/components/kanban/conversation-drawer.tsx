'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Pause, Play, Send, ThumbsUp, ThumbsDown, Bot, User, AlertCircle } from 'lucide-react'
import { apiClient, type Session, type Message } from '../../lib/api'
import { useConversation } from '../../hooks/use-kanban'
import { cn, formatRelativeTime, confidenceBg } from '../../lib/utils'

type ConversationDrawerProps = {
  session: Session
  onClose: () => void
  onSessionUpdate: (updated: Session) => void
}

export function ConversationDrawer({ session, onClose, onSessionUpdate }: ConversationDrawerProps) {
  const { messages, loading, load } = useConversation(session.id)
  const [manualMsg, setManualMsg] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [load])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handlePause = async () => {
    await apiClient.sessions.pause(session.id, !session.sofia_paused)
    onSessionUpdate({ ...session, sofia_paused: !session.sofia_paused })
  }

  const handleSend = async () => {
    if (!manualMsg.trim()) return
    setSending(true)
    try {
      await apiClient.sessions.sendMessage(session.id, manualMsg, session.bitrix_dialog_id)
      setManualMsg('')
      await load()
    } finally {
      setSending(false)
    }
  }

  const handleFeedback = async (messageId: string, fb: 'positive' | 'negative') => {
    await apiClient.messages.feedback(messageId, fb)
    await load()
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="relative flex flex-col w-full max-w-lg h-full bg-gray-900 border-l border-gray-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-600/20 border border-brand-600/30 text-brand-400 font-bold">
              {session.users?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="font-semibold text-white">{session.users?.name ?? 'Usuário'}</p>
              <p className="text-xs text-gray-400">{session.users?.position ?? 'Bitrix24'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePause}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                session.sofia_paused
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 hover:bg-emerald-600/30'
                  : 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30 hover:bg-yellow-600/30'
              )}
            >
              {session.sofia_paused ? (
                <><Play className="w-3 h-3" /> Retomar</>
              ) : (
                <><Pause className="w-3 h-3" /> Pausar</>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sofia paused badge */}
        {session.sofia_paused && (
          <div className="flex items-center gap-2 px-5 py-2.5 bg-yellow-500/10 border-b border-yellow-600/20">
            <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            <p className="text-xs text-yellow-300">Sofia pausada — mensagens não serão respondidas automaticamente</p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loading && messages.length === 0 && (
            <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
              Carregando...
            </div>
          )}
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onFeedback={handleFeedback}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Manual message input */}
        <div className="flex items-end gap-2 px-4 py-3 border-t border-gray-800 bg-gray-900">
          <textarea
            value={manualMsg}
            onChange={(e) => setManualMsg(e.target.value)}
            placeholder="Enviar mensagem como Sofia..."
            rows={2}
            className="flex-1 resize-none bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-brand-600"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend() }
            }}
          />
          <button
            onClick={() => void handleSend()}
            disabled={sending || !manualMsg.trim()}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── MessageBubble ─────────────────────────────────────────────────────────────

function MessageBubble({
  message,
  onFeedback,
}: {
  message: Message
  onFeedback: (id: string, fb: 'positive' | 'negative') => void
}) {
  const isUser = message.role === 'user'
  const isAdmin = message.role === 'admin_as_sofia'

  return (
    <div className={cn('flex flex-col gap-1', !isUser && 'items-end')}>
      <div
        className={cn(
          'flex items-end gap-2',
          isUser ? 'flex-row' : 'flex-row-reverse'
        )}
      >
        <div
          className={cn(
            'flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0 text-xs',
            isUser
              ? 'bg-gray-700 text-gray-300'
              : isAdmin
              ? 'bg-purple-600/30 text-purple-300 border border-purple-600/40'
              : 'bg-brand-600/30 text-brand-300 border border-brand-600/40'
          )}
        >
          {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
        </div>

        <div
          className={cn(
            'max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
            isUser
              ? 'bg-gray-800 text-gray-100 rounded-bl-md'
              : isAdmin
              ? 'bg-purple-900/40 text-purple-100 border border-purple-700/30 rounded-br-md'
              : 'bg-brand-600/20 text-brand-50 border border-brand-600/20 rounded-br-md'
          )}
        >
          {message.content}
        </div>
      </div>

      {/* Meta row */}
      <div className={cn('flex items-center gap-2 px-9', isUser ? 'flex-row' : 'flex-row-reverse')}>
        <span className="text-[11px] text-gray-600">
          {formatRelativeTime(message.created_at)}
        </span>
        {message.confidence != null && (
          <span className={cn('text-[11px] px-1.5 py-0.5 rounded border', confidenceBg(message.confidence))}>
            {(message.confidence * 100).toFixed(0)}%
          </span>
        )}
        {!isUser && (
          <div className="flex items-center gap-1 ml-1">
            <button
              onClick={() => onFeedback(message.id, 'positive')}
              className={cn(
                'p-0.5 rounded hover:bg-gray-700 transition-colors',
                message.feedback === 'positive' ? 'text-emerald-400' : 'text-gray-600'
              )}
            >
              <ThumbsUp className="w-3 h-3" />
            </button>
            <button
              onClick={() => onFeedback(message.id, 'negative')}
              className={cn(
                'p-0.5 rounded hover:bg-gray-700 transition-colors',
                message.feedback === 'negative' ? 'text-red-400' : 'text-gray-600'
              )}
            >
              <ThumbsDown className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
