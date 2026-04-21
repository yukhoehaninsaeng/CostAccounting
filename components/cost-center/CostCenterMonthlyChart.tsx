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
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import type { CostCenterActual } from '@/types'

interface Props {
  actuals: CostCenterActual[]
}

function formatAxisValue(value: number) {
  if (value >= 100000000) return `${(value / 100000000).toFixed(1)}억`
  return `${(value / 10000000).toFixed(0)}천만`
}

export default function CostCenterMonthlyChart({ actuals }: Props) {
  const periodMap = new Map<number, { actual_amount: number; plan_amount: number }>()
  for (const r of actuals) {
    const existing = periodMap.get(r.fiscal_period)
    if (existing) {
      existing.actual_amount += r.actual_amount
      existing.plan_amount += r.plan_amount
    } else {
      periodMap.set(r.fiscal_period, { actual_amount: r.actual_amount, plan_amount: r.plan_amount })
    }
  }

  const chartData = Array.from(periodMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([period, v]) => ({ name: `${period}월`, 실적: v.actual_amount, 계획: v.plan_amount }))

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">월별 원가 추이</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
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
