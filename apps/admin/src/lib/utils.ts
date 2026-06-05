import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(usd: number): string {
  if (usd < 0.01) return `$${(usd * 100).toFixed(3)}¢`
  return `$${usd.toFixed(4)}`
}

export function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

export function confidenceColor(confidence: number): string {
  if (confidence >= 0.75) return 'text-emerald-400'
  if (confidence >= 0.5) return 'text-yellow-400'
  return 'text-red-400'
}

export function confidenceBg(confidence: number): string {
  if (confidence >= 0.75) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  if (confidence >= 0.5) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
  return 'bg-red-500/20 text-red-300 border-red-500/30'
}
