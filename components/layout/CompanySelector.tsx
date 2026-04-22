'use client'

import { useEffect, useRef, useState } from 'react'
import { useQueryState, parseAsString } from 'nuqs'
import { ChevronDown, ChevronRight, Check, Building2 } from 'lucide-react'
import { COMPANIES, COMPANY_LIST } from '@/lib/companies'

type SelectionType = 'ALL' | 'CO' | 'PLANT'

interface Selection {
  type: SelectionType
  bukrs: string | null
  plant: string | null
}

export default function CompanySelector() {
  const [bukrs, setBukrs] = useQueryState('bukrs', parseAsString.withDefault('all'))
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Derive selection from URL param
  const sel: Selection = bukrs === 'all'
    ? { type: 'ALL', bukrs: null, plant: null }
    : { type: 'CO', bukrs, plant: bukrs } // 1 plant per company → same code

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutsideClick)
    return () => document.removeEventListener('mousedown', onOutsideClick)
  }, [])

  function selectAll() {
    setBukrs('all')
    setOpen(false)
  }

  function selectCompany(code: string) {
    setBukrs(code)
    setExpanded(code)
  }

  function toggleExpand(code: string, e: React.MouseEvent) {
    e.stopPropagation()
    setExpanded(expanded === code ? null : code)
  }

  const co = sel.bukrs ? COMPANIES[sel.bukrs] : null

  return (
    <div className="relative" ref={panelRef}>
      {/* 트리거 */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
          open
            ? 'bg-slate-50 border-slate-300'
            : 'bg-white border-slate-200 hover:bg-slate-50'
        }`}
      >
        <Building2 size={14} className="text-slate-400 flex-shrink-0" />
        <span className="text-xs text-slate-500 font-medium hidden sm:block">회사코드</span>

        {sel.type === 'ALL' ? (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600">
            ALL
          </span>
        ) : co ? (
          <>
            <span
              className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold"
              style={{ background: co.bgColor, color: co.textColor }}
            >
              {co.bukrs}
            </span>
            <span className="text-xs text-slate-700 font-medium hidden md:block">{co.name}</span>
          </>
        ) : null}

        <ChevronDown
          size={13}
          className={`text-slate-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* 드롭다운 패널 */}
      {open && (
        <div className="absolute top-full left-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-50 min-w-[280px] overflow-hidden">

          {/* 전체 */}
          <button
            onClick={selectAll}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left border-b border-slate-100 transition-colors ${
              sel.type === 'ALL' ? 'bg-slate-50' : 'hover:bg-slate-50'
            }`}
          >
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600">
              ALL
            </span>
            <span className="text-slate-700 font-medium">전체 회사 · 전체 플랜트</span>
            {sel.type === 'ALL' && <Check size={13} className="ml-auto text-slate-600" />}
          </button>

          {/* 회사별 */}
          {COMPANY_LIST.map((company) => {
            const isExpanded = expanded === company.bukrs
            const isSelected = sel.bukrs === company.bukrs

            return (
              <div key={company.bukrs} className="border-b border-slate-100 last:border-b-0">
                {/* 회사 행 */}
                <div
                  className={`flex items-center gap-2.5 px-4 py-2.5 cursor-pointer transition-colors ${
                    isSelected ? 'bg-slate-50' : 'hover:bg-slate-50'
                  }`}
                  onClick={() => selectCompany(company.bukrs)}
                >
                  <span
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold flex-shrink-0"
                    style={{ background: company.bgColor, color: company.textColor }}
                  >
                    {company.bukrs}
                  </span>
                  <span className="text-sm text-slate-700 flex-1">{company.name}</span>
                  <span className="text-xs text-slate-400">플랜트 1개</span>
                  {isSelected && <Check size={13} className="text-slate-600 flex-shrink-0" />}
                  <button
                    onClick={(e) => toggleExpand(company.bukrs, e)}
                    className="ml-1 text-slate-300 hover:text-slate-500"
                  >
                    <ChevronRight size={13} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>
                </div>

                {/* 플랜트 sub-row */}
                {isExpanded && (
                  <div
                    className="flex items-center gap-2.5 pl-8 pr-4 py-2 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => { selectCompany(company.bukrs); setOpen(false) }}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: company.color }}
                    />
                    <span className="font-mono text-xs text-slate-500 w-10">{company.plant}</span>
                    <span className="text-xs text-slate-600 flex-1">플랜트 {company.plant} — {company.name} 생산</span>
                    {isSelected && <Check size={11} className="text-slate-500" />}
                  </div>
                )}
              </div>
            )
          })}

          {/* 선택 경로 표시 */}
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-1 text-xs text-slate-500">
            <span>선택:</span>
            {sel.type === 'ALL' ? (
              <span>전체 회사 · 전체 플랜트</span>
            ) : co ? (
              <>
                <span
                  className="px-1 py-0.5 rounded text-xs font-semibold"
                  style={{ background: co.bgColor, color: co.textColor }}
                >
                  {co.bukrs}
                </span>
                <span>{co.name} · 플랜트 {co.plant}</span>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
