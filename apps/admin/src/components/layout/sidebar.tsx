'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, MessageSquare, Brain, Users, AlertTriangle, Settings, Bot } from 'lucide-react'
import { cn } from '../../lib/utils'

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/kanban', icon: MessageSquare, label: 'Conversas' },
  { href: '/knowledge', icon: Brain, label: 'Conhecimento' },
  { href: '/users', icon: Users, label: 'Usuários' },
  { href: '/alerts', icon: AlertTriangle, label: 'Alertas' },
  { href: '/settings', icon: Settings, label: 'Configurações' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-gray-900 border-r border-gray-800">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-600">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-white leading-none">Sofia</p>
          <p className="text-xs text-gray-400 mt-0.5">Assistente Virtual</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-brand-600/20 text-brand-400 border border-brand-600/30'
                : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-800">
        <p className="text-xs text-gray-600">Fortatech © 2025</p>
      </div>
    </aside>
  )
}
