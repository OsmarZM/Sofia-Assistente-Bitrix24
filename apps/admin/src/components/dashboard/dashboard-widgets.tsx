'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts'
import { MessageSquare, DollarSign, Zap, TrendingUp, AlertTriangle, Clock } from 'lucide-react'
import { useDashboardMetrics, useCostChart } from '../../hooks/use-dashboard'
import { cn, formatCurrency } from '../../lib/utils'

export function DashboardWidgets() {
  const { data: metrics, loading } = useDashboardMetrics('7d')
  const costChart = useCostChart(7)

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
        Carregando métricas...
      </div>
    )
  }

  const kpis = [
    {
      label: 'Mensagens (7d)',
      value: metrics.messages.total.toLocaleString('pt-BR'),
      sub: `${metrics.messages.today} hoje`,
      icon: MessageSquare,
      color: 'text-brand-400',
      bg: 'bg-brand-600/10 border-brand-600/20',
    },
    {
      label: 'Custo Total',
      value: formatCurrency(metrics.cost.usd),
      sub: `${(metrics.cost.tokensIn + metrics.cost.tokensOut).toLocaleString('pt-BR')} tokens`,
      icon: DollarSign,
      color: 'text-emerald-400',
      bg: 'bg-emerald-600/10 border-emerald-600/20',
    },
    {
      label: 'Taxa de Resposta',
      value: `${metrics.quality.answerRate.toFixed(0)}%`,
      sub: `${metrics.quality.noAnswerCount} sem resposta`,
      icon: TrendingUp,
      color: 'text-yellow-400',
      bg: 'bg-yellow-600/10 border-yellow-600/20',
    },
    {
      label: 'Cache Hit',
      value: `${metrics.cache.hitRate.toFixed(0)}%`,
      sub: `${metrics.cache.hits} hits`,
      icon: Zap,
      color: 'text-purple-400',
      bg: 'bg-purple-600/10 border-purple-600/20',
    },
    {
      label: 'Sessões Ativas',
      value: metrics.sessions.active.toLocaleString('pt-BR'),
      sub: 'em aberto',
      icon: Clock,
      color: 'text-blue-400',
      bg: 'bg-blue-600/10 border-blue-600/20',
    },
    {
      label: 'Sugestões Pendentes',
      value: metrics.suggestions.pending.toString(),
      sub: 'aguardam revisão',
      icon: AlertTriangle,
      color: 'text-orange-400',
      bg: 'bg-orange-600/10 border-orange-600/20',
    },
  ]

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className={cn('flex flex-col gap-2 p-4 rounded-xl border bg-gray-900', bg)}>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400 font-medium">{label}</p>
              <Icon className={cn('w-4 h-4', color)} />
            </div>
            <p className={cn('text-2xl font-bold', color)}>{value}</p>
            <p className="text-xs text-gray-500">{sub}</p>
          </div>
        ))}
      </div>

      {/* Budgets */}
      {metrics.budgets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {metrics.budgets.map((b) => {
            const pct = Math.min(100, ((b.current_usd ?? 0) / (b.limit_usd ?? 1)) * 100)
            const color = pct >= 100 ? 'bg-red-500' : pct >= (b.alert_threshold_pct ?? 80) ? 'bg-yellow-500' : 'bg-emerald-500'
            return (
              <div key={b.period} className="p-4 bg-gray-900 rounded-xl border border-gray-800">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-400 capitalize">Budget {b.period}</span>
                  <span className="text-gray-300 font-medium">{formatCurrency(b.current_usd ?? 0)} / {formatCurrency(b.limit_usd ?? 0)}</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">{pct.toFixed(0)}% utilizado</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Cost chart */}
      {costChart.length > 0 && (
        <div className="p-5 bg-gray-900 rounded-xl border border-gray-800">
          <h3 className="text-sm font-semibold text-gray-200 mb-4">Custo Diário (7 dias)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={costChart}>
              <defs>
                <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={(v) => `$${v.toFixed(3)}`} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                labelStyle={{ color: '#e5e7eb' }}
                formatter={(v: number) => [formatCurrency(v), 'Custo']}
              />
              <Area type="monotone" dataKey="costUsd" stroke="#6366f1" fill="url(#costGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Alerts */}
      {metrics.alerts.length > 0 && (
        <div className="p-5 bg-gray-900 rounded-xl border border-gray-800">
          <h3 className="text-sm font-semibold text-gray-200 mb-3">Alertas Recentes</h3>
          <div className="space-y-2">
            {metrics.alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border text-sm',
                  alert.severity === 'critical'
                    ? 'bg-red-950/30 border-red-800/40 text-red-200'
                    : alert.severity === 'warning'
                    ? 'bg-yellow-950/30 border-yellow-800/40 text-yellow-200'
                    : 'bg-gray-800/50 border-gray-700 text-gray-300'
                )}
              >
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
