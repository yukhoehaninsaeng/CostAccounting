import { cn } from '@/lib/utils/format'
import type { MaterialType, SyncStatus } from '@/types'

type BadgeType = MaterialType | SyncStatus | string

const CONFIG: Record<string, { label: string; className: string }> = {
  FERT: { label: 'FERT', className: 'bg-[#e6f1fb] text-[#0c447c]' },
  HALB: { label: 'HALB', className: 'bg-[#e1f5ee] text-[#085041]' },
  ROH: { label: 'ROH', className: 'bg-[#faeeda] text-[#633806]' },
  SUCCESS: { label: '성공', className: 'bg-green-100 text-green-700' },
  FAILED: { label: '실패', className: 'bg-red-100 text-red-700' },
  RUNNING: { label: '실행중', className: 'bg-blue-100 text-blue-700 animate-pulse' },
  PENDING: { label: '대기', className: 'bg-slate-100 text-slate-600' },
}

interface StatusBadgeProps {
  type: BadgeType
  className?: string
}

export default function StatusBadge({ type, className }: StatusBadgeProps) {
  const config = CONFIG[type] ?? { label: type, className: 'bg-slate-100 text-slate-600' }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold', config.className, className)}>
      {config.label}
    </span>
  )
}
