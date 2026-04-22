'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

export interface FilterState {
  year: number
  period: number
  model: string
  bukrs: string
}

interface FilterContextValue {
  pending: FilterState
  setPending: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void
  search: () => void
}

const FilterContext = createContext<FilterContextValue>({
  pending: { year: 2025, period: 12, model: 'all', bukrs: 'all' },
  setPending: () => {},
  search: () => {},
})

function parseParams(searchParams: URLSearchParams): FilterState {
  return {
    year: Number(searchParams.get('year') ?? 2025),
    period: Number(searchParams.get('period') ?? 12),
    model: searchParams.get('model') ?? 'all',
    bukrs: searchParams.get('bukrs') ?? 'all',
  }
}

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const [pending, setPendingState] = useState<FilterState>(() =>
    parseParams(searchParams)
  )

  // URL이 외부에서 바뀔 때(사이드바 이동, 브라우저 뒤로가기) pending 상태를 동기화
  const paramsStr = searchParams.toString()
  useEffect(() => {
    setPendingState(parseParams(searchParams))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsStr])

  const setPending = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      setPendingState((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const search = useCallback(() => {
    const params = new URLSearchParams()
    params.set('year', String(pending.year))
    params.set('period', String(pending.period))
    params.set('model', pending.model)
    params.set('bukrs', pending.bukrs)
    router.push(`${pathname}?${params.toString()}`)
  }, [pending, pathname, router])

  return (
    <FilterContext.Provider value={{ pending, setPending, search }}>
      {children}
    </FilterContext.Provider>
  )
}

export const useFilter = () => useContext(FilterContext)
