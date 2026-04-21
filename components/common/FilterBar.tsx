'use client'

import { getYearOptions, getPeriodOptions } from '@/lib/utils'
import type { ProfitCenter } from '@/types'

interface FilterBarProps {
  fiscal_year: number
  fiscal_period?: number
  profit_center_id?: string
  profitCenters?: ProfitCenter[]
  onYearChange: (year: number) => void
  onPeriodChange?: (period: number | undefined) => void
  onProfitCenterChange?: (id: string | undefined) => void
}

export default function FilterBar({
  fiscal_year,
  fiscal_period,
  profit_center_id,
  profitCenters,
  onYearChange,
  onPeriodChange,
  onProfitCenterChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-white border-b border-slate-200">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-slate-600">회계연도</label>
        <select
          value={fiscal_year}
          onChange={(e) => onYearChange(Number(e.target.value))}
          className="text-sm border border-slate-200 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {getYearOptions().map((y) => (
            <option key={y} value={y}>
              {y}년
            </option>
          ))}
        </select>
      </div>

      {onPeriodChange && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600">기간</label>
          <select
            value={fiscal_period ?? ''}
            onChange={(e) => onPeriodChange(e.target.value ? Number(e.target.value) : undefined)}
            className="text-sm border border-slate-200 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체</option>
            {getPeriodOptions().map((p) => (
              <option key={p} value={p}>
                {p}월
              </option>
            ))}
          </select>
        </div>
      )}

      {onProfitCenterChange && profitCenters && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600">본부</label>
          <select
            value={profit_center_id ?? ''}
            onChange={(e) => onProfitCenterChange(e.target.value || undefined)}
            className="text-sm border border-slate-200 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체</option>
            {profitCenters.map((pc) => (
              <option key={pc.id} value={pc.id}>
                {pc.profit_center_name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
