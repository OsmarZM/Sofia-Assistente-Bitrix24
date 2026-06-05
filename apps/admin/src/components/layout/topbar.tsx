'use client'

import { Bell, Search } from 'lucide-react'
import { cn } from '../../lib/utils'

type TopbarProps = {
  title: string
  alertCount?: number
}

export function Topbar({ title, alertCount = 0 }: TopbarProps) {
  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-gray-800 bg-gray-950">
      <h1 className="text-lg font-semibold text-white">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            className="pl-9 pr-4 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-brand-600 w-52"
            placeholder="Buscar..."
          />
        </div>
        <button className="relative p-2 rounded-lg hover:bg-gray-800 transition-colors">
          <Bell className="w-5 h-5 text-gray-400" />
          {alertCount > 0 && (
            <span
              className={cn(
                'absolute -top-0.5 -right-0.5 flex items-center justify-center',
                'w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold'
              )}
            >
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
