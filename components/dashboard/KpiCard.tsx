import { formatCurrency, formatPercent } from '@/lib/utils'

interface KpiCardProps {
  title: string
  value: number | string
  subValue?: string
  trend?: number
  format?: 'currency' | 'number' | 'percent' | 'count'
  className?: string
}

export default function KpiCard({ title, value, subValue, trend, format = 'currency', className = '' }: KpiCardProps) {
  const displayValue =
    format === 'currency' && typeof value === 'number'
      ? formatCurrency(value)
      : format === 'percent' && typeof value === 'number'
      ? `${value.toFixed(1)}%`
      : String(value)

  const trendPositive = trend !== undefined && trend > 0
  const trendNegative = trend !== undefined && trend < 0

  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-5 ${className}`}>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="text-2xl font-bold text-slate-800 mt-1">{displayValue}</p>
      {(subValue || trend !== undefined) && (
        <div className="flex items-center gap-2 mt-2">
          {trend !== undefined && (
            <span
              className={`text-xs font-medium ${
                trendPositive ? 'text-red-500' : trendNegative ? 'text-green-500' : 'text-slate-400'
              }`}
            >
              {trendPositive ? '▲' : trendNegative ? '▼' : '—'} {Math.abs(trend).toFixed(1)}%
            </span>
          )}
          {subValue && <span className="text-xs text-slate-400">{subValue}</span>}
        </div>
      )}
    </div>
  )
}
