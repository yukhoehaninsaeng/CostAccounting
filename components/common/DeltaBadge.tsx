import { cn, fmtKRW, fmtRate } from '@/lib/utils/format'

interface DeltaBadgeProps {
  value: number
  type?: 'amount' | 'qty' | 'rate'
  isInverse?: boolean  // 재료비율 등 — 높을수록 나쁨
  showValue?: boolean
}

export default function DeltaBadge({
  value,
  type = 'rate',
  isInverse = false,
  showValue = true,
}: DeltaBadgeProps) {
  if (value === 0) {
    return <span className="text-xs text-slate-400">—</span>
  }

  const positive = isInverse ? value < 0 : value > 0
  const icon = value > 0 ? '▲' : '▼'

  const displayValue = !showValue
    ? ''
    : type === 'amount'
    ? fmtKRW(Math.abs(value))
    : type === 'qty'
    ? `${Math.abs(value).toLocaleString('ko-KR')} EA`
    : fmtRate(Math.abs(value))

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-semibold',
        positive ? 'text-green-600' : 'text-red-500'
      )}
    >
      {icon} {displayValue}
    </span>
  )
}
