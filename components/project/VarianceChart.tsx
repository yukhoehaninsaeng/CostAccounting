'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import type { ProjectActual } from '@/types'

interface Props {
  actuals: ProjectActual[]
}

function formatAxisValue(value: number) {
  if (value >= 100000000) return `${(value / 100000000).toFixed(1)}억`
  return `${(value / 10000000).toFixed(0)}천만`
}

export default function VarianceChart({ actuals }: Props) {
  // 원가요소별 집계
  const elementMap = new Map<string, { name: string; actual: number; plan: number }>()
  for (const r of actuals) {
    const key = r.cost_element_name
    const existing = elementMap.get(key)
    if (existing) {
      existing.actual += r.actual_amount
      existing.plan += r.plan_amount
    } else {
      elementMap.set(key, { name: key, actual: r.actual_amount, plan: r.plan_amount })
    }
  }

  const chartData = Array.from(elementMap.values()).map((e) => ({
    name: e.name.length > 7 ? e.name.slice(0, 7) + '…' : e.name,
    실적: e.actual,
    계획: e.plan,
    차이: e.actual - e.plan,
  }))

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">원가요소별 실적 vs 계획</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={formatAxisValue} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="실적" fill="#3b82f6" radius={[3, 3, 0, 0]} />
          <Bar dataKey="계획" fill="#cbd5e1" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
