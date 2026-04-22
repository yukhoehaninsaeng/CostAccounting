import { cn } from '@/lib/utils/format'
import DeltaBadge from './DeltaBadge'

interface KpiCardProps {
  label: string
  value: string
  sub?: string
  delta?: number
  deltaType?: 'amount' | 'qty' | 'rate'
  deltaLabel?: string
  isInverse?: boolean
  className?: string
}

export default function KpiCard({
  label,
  value,
  sub,
  delta,
  deltaType = 'rate',
  deltaLabel,
  isInverse = false,
  className,
}: KpiCardProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 p-5', className)}>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-slate-800 mt-1.5 leading-none">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      {delta !== undefined && (
        <div className="flex items-center gap-1.5 mt-2">
          <DeltaBadge value={delta} type={deltaType} isInverse={isInverse} />
          {deltaLabel && <span className="text-xs text-slate-400">{deltaLabel}</span>}
        </div>
      )}
    </div>
  )
}
