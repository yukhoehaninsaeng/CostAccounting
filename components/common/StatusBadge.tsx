import type { ProjectStatus, TransferStatus } from '@/types'

type Status = ProjectStatus | TransferStatus

const statusConfig: Record<Status, { label: string; className: string }> = {
  ACTIVE: { label: '진행중', className: 'bg-green-100 text-green-700' },
  CLOSED: { label: '완료', className: 'bg-slate-100 text-slate-600' },
  PLANNED: { label: '예정', className: 'bg-blue-100 text-blue-700' },
  CONFIRMED: { label: '확정', className: 'bg-green-100 text-green-700' },
  DRAFT: { label: '초안', className: 'bg-yellow-100 text-yellow-700' },
  REVERSED: { label: '역분개', className: 'bg-red-100 text-red-700' },
}

interface StatusBadgeProps {
  status: Status
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}
