'use client'

import { useQueryState, parseAsInteger, parseAsString } from 'nuqs'
import { RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { MODEL_LABELS, periodLabel } from '@/lib/utils/format'
import { cn } from '@/lib/utils/format'

const YEARS = [2025, 2024]
const PERIODS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const MODELS = ['all', 'ston-s', 'ston-cart', 'ston-plus']

interface HeaderProps {
  dataSource?: 'SAP' | 'MOCK'
}

export default function Header({ dataSource = 'MOCK' }: HeaderProps) {
  const [year, setYear] = useQueryState('year', parseAsInteger.withDefault(2025))
  const [period, setPeriod] = useQueryState('period', parseAsInteger.withDefault(12))
  const [model, setModel] = useQueryState('model', parseAsString.withDefault('all'))
  const [syncing, setSyncing] = useState(false)

  async function handleSync() {
    setSyncing(true)
    try {
      await fetch('/api/sap-sync', { method: 'POST' })
    } finally {
      setTimeout(() => setSyncing(false), 1500)
    }
  }

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-5 gap-4 flex-shrink-0">
      {/* 필터 그룹 */}
      <div className="flex items-center gap-3">
        {/* 회계연도 */}
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-slate-500 font-medium">회계연도</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="text-sm border border-slate-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
        </div>

        {/* 기간 */}
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-slate-500 font-medium">기간</label>
          <select
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
            className="text-sm border border-slate-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PERIODS.map((p) => (
              <option key={p} value={p}>{periodLabel(p)}</option>
            ))}
          </select>
        </div>

        {/* 제품군 */}
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-slate-500 font-medium">제품군</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="text-sm border border-slate-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MODELS.map((m) => (
              <option key={m} value={m}>{MODEL_LABELS[m]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1" />

      {/* 데이터 소스 뱃지 */}
      <span className={cn(
        'text-xs font-semibold px-2 py-0.5 rounded-full',
        dataSource === 'SAP'
          ? 'bg-green-100 text-green-700'
          : 'bg-orange-100 text-orange-700'
      )}>
        {dataSource}
      </span>

      {/* SAP 동기화 버튼 */}
      <button
        onClick={handleSync}
        disabled={syncing}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-[#0c1e3c] text-white rounded-lg hover:bg-[#1a3258] transition-colors disabled:opacity-60"
      >
        <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
        SAP 동기화
      </button>
    </header>
  )
}
