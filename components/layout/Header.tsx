'use client'

import { RefreshCw, Search, Database } from 'lucide-react'
import { useState } from 'react'
import { MODEL_LABELS, periodLabel } from '@/lib/utils/format'
import { cn } from '@/lib/utils/format'
import { useFilter } from '@/lib/filter-context'
import CompanySelector from './CompanySelector'

const YEARS = [2025, 2024]
const PERIODS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const MODELS = ['all', 'ston-s', 'ston-cart', 'ston-plus']

interface HeaderProps {
  dataSource?: 'SAP' | 'MOCK'
}

export default function Header({ dataSource = 'MOCK' }: HeaderProps) {
  const { pending, setPending, search } = useFilter()
  const [syncing, setSyncing] = useState(false)

  async function handleSync() {
    setSyncing(true)
    try {
      await fetch('/api/sap-sync', { method: 'POST' })
    } finally {
      setTimeout(() => setSyncing(false), 1500)
    }
  }

  const selectCls =
    'text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700'
  const labelCls = 'text-xs text-slate-400 font-medium'

  return (
    <header className="bg-white border-b border-slate-200 flex-shrink-0">
      <div className="flex items-center gap-0 divide-x divide-slate-100 px-0 h-12">

        {/* 회사코드 드릴다운 */}
        <div className="flex items-center gap-2 px-4 h-full">
          <CompanySelector />
        </div>

        {/* 회계연도 */}
        <div className="flex items-center gap-1.5 px-4 h-full">
          <span className={labelCls}>회계연도</span>
          <select
            value={pending.year}
            onChange={(e) => setPending('year', Number(e.target.value))}
            className={selectCls}
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
        </div>

        {/* 기간 */}
        <div className="flex items-center gap-1.5 px-4 h-full">
          <span className={labelCls}>기간</span>
          <select
            value={pending.period}
            onChange={(e) => setPending('period', Number(e.target.value))}
            className={selectCls}
          >
            {PERIODS.map((p) => (
              <option key={p} value={p}>{periodLabel(p)}</option>
            ))}
          </select>
        </div>

        {/* 제품군 */}
        <div className="flex items-center gap-1.5 px-4 h-full">
          <span className={labelCls}>제품군</span>
          <select
            value={pending.model}
            onChange={(e) => setPending('model', e.target.value)}
            className={selectCls}
          >
            {MODELS.map((m) => (
              <option key={m} value={m}>{MODEL_LABELS[m]}</option>
            ))}
          </select>
        </div>

        {/* 조회 버튼 */}
        <div className="flex items-center px-3 h-full">
          <button
            onClick={search}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm"
          >
            <Search size={12} />
            조회
          </button>
        </div>

        {/* 우측 영역 */}
        <div className="flex-1" />
        <div className="flex items-center gap-3 px-4 h-full">
          {/* 데이터 소스 뱃지 */}
          <div className={cn(
            'flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
            dataSource === 'SAP'
              ? 'bg-green-100 text-green-700'
              : 'bg-amber-100 text-amber-700'
          )}>
            <Database size={10} />
            {dataSource}
          </div>

          {/* SAP RFC 조회 */}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#0c1e3c] text-white rounded-lg hover:bg-[#1a3258] transition-colors disabled:opacity-60"
          >
            <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
            SAP RFC 조회
          </button>
        </div>
      </div>
    </header>
  )
}
