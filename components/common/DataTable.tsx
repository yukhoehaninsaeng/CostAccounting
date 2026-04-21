'use client'

import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils/format'

export interface Column<T> {
  key: keyof T | string
  header: string
  headerGroup?: string        // 컬럼 그룹 헤더 (colspan)
  align?: 'left' | 'right' | 'center'
  sortable?: boolean
  render?: (value: unknown, row: T, index: number) => React.ReactNode
  className?: string
  footerValue?: React.ReactNode
}

interface DataTableProps<T extends object> {
  columns: Column<T>[]
  data: T[]
  searchable?: boolean
  searchKeys?: (keyof T)[]
  pageSize?: number
  onRowClick?: (row: T) => void
  className?: string
  rowClassName?: (row: T) => string
}

type SortDir = 'asc' | 'desc' | null

export default function DataTable<T extends object>({
  columns,
  data,
  searchable = true,
  searchKeys = [],
  pageSize = 50,
  onRowClick,
  className,
  rowClassName,
}: DataTableProps<T>) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)
  const [page, setPage] = useState(1)

  // 검색 필터
  const filtered = useMemo(() => {
    if (!query.trim()) return data
    const q = query.toLowerCase()
    return data.filter((row) => {
      const r = row as Record<string, unknown>
      const keys = searchKeys.length > 0 ? searchKeys : (Object.keys(r) as (keyof T)[])
      return keys.some((k) => {
        const v = r[String(k)]
        return v !== null && v !== undefined && String(v).toLowerCase().includes(q)
      })
    })
  }, [data, query, searchKeys])

  // 정렬
  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered
    return [...filtered].sort((a, b) => {
      const av = (a as Record<string, unknown>)[sortKey]
      const bv = (b as Record<string, unknown>)[sortKey]
      if (av === null || av === undefined) return 1
      if (bv === null || bv === undefined) return -1
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), 'ko')
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  // 페이지네이션
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize)

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc'))
      if (sortDir === 'desc') setSortKey(null)
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(1)
  }

  function handleSearch(v: string) {
    setQuery(v)
    setPage(1)
  }

  // 그룹 헤더 계산
  const hasGroupHeader = columns.some((c) => c.headerGroup)
  const groupHeaders: { label: string; span: number }[] = []
  if (hasGroupHeader) {
    let currentGroup = ''
    let currentSpan = 0
    for (const col of columns) {
      const g = col.headerGroup ?? ''
      if (g === currentGroup) {
        currentSpan++
      } else {
        if (currentGroup !== '' || currentSpan > 0) groupHeaders.push({ label: currentGroup, span: currentSpan })
        currentGroup = g
        currentSpan = 1
      }
    }
    groupHeaders.push({ label: currentGroup, span: currentSpan })
  }

  const hasFooter = columns.some((c) => c.footerValue !== undefined)

  return (
    <div className={cn('flex flex-col', className)}>
      {/* 검색 바 */}
      {searchable && (
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="자재코드 · 제품명 검색..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <span className="text-xs text-slate-400 ml-1">{sorted.length.toLocaleString('ko-KR')}건</span>
        </div>
      )}

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            {hasGroupHeader && (
              <tr className="border-b border-slate-200">
                {groupHeaders.map((g, i) => (
                  <th
                    key={i}
                    colSpan={g.span}
                    className={cn(
                      'px-3 py-2 text-xs font-semibold text-center border-r border-slate-100 last:border-r-0',
                      g.label === '실적' ? 'bg-[#0c1e3c] text-white' :
                      g.label === '편성' ? 'bg-slate-400 text-white' :
                      g.label === '차이' ? 'bg-slate-200 text-slate-700' :
                      'bg-slate-50 text-slate-600'
                    )}
                  >
                    {g.label}
                  </th>
                ))}
              </tr>
            )}
            <tr className="border-b border-slate-200 bg-slate-50">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={cn(
                    'px-3 py-2.5 text-xs font-medium text-slate-500 whitespace-nowrap',
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                    col.sortable && 'cursor-pointer hover:text-slate-700 select-none',
                    col.className
                  )}
                  onClick={col.sortable ? () => toggleSort(String(col.key)) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      sortKey === String(col.key) ? (
                        sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                      ) : (
                        <ChevronsUpDown size={12} className="text-slate-300" />
                      )
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'border-b border-slate-50 transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-blue-50',
                  !onRowClick && 'hover:bg-slate-50',
                  rowClassName?.(row)
                )}
              >
                {columns.map((col) => {
                  const rawVal = (row as Record<string, unknown>)[String(col.key)]
                  return (
                    <td
                      key={String(col.key)}
                      className={cn(
                        'px-3 py-2.5',
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                        col.className
                      )}
                    >
                      {col.render ? col.render(rawVal, row, rowIndex) : String(rawVal ?? '')}
                    </td>
                  )
                })}
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-10 text-center text-slate-400 text-sm">
                  조회된 데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
          {hasFooter && (
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-100 font-semibold">
                {columns.map((col, i) => (
                  <td
                    key={i}
                    className={cn(
                      'px-3 py-2.5 text-sm text-slate-700',
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    )}
                  >
                    {col.footerValue}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 py-3 border-t border-slate-100">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-2 py-1 text-xs rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-100"
          >
            ‹
          </button>
          {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
            const p = Math.max(1, Math.min(page - 3, totalPages - 6)) + i
            if (p < 1 || p > totalPages) return null
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  'w-7 h-7 text-xs rounded border',
                  p === page ? 'bg-[#0c1e3c] text-white border-[#0c1e3c]' : 'border-slate-200 hover:bg-slate-100'
                )}
              >
                {p}
              </button>
            )
          })}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-2 py-1 text-xs rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-100"
          >
            ›
          </button>
        </div>
      )}
    </div>
  )
}
