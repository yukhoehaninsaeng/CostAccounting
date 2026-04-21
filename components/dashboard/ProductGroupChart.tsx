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
import { fmtKRW } from '@/lib/utils/format'
import type { ChartDataItem } from '@/types'

interface Props {
  data: ChartDataItem[]
}

const GROUP_LABELS: Record<string, string> = {
  'STON-S': 'STON-S',
  'STON-CART': 'STON+(카트)',
  'STON-PLUS': 'STON+',
}

function fmtAxis(v: number) {
  if (v >= 100_000_000) return `${(v / 100_000_000).toFixed(0)}억`
  if (v >= 10_000_000) return `${(v / 10_000_000).toFixed(0)}천만`
  return `${(v / 1_000_000).toFixed(0)}백만`
}

export default function ProductGroupChart({ data }: Props) {
  const chartData = data.map((d) => ({
    name: GROUP_LABELS[d.model_group] ?? d.model_group,
    실적: d.actual_amount,
    편성: d.plan_amount,
  }))

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">제품군별 실적 vs 편성</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 5, right: 16, left: 10, bottom: 5 }} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v: number) => fmtKRW(v)} contentStyle={{ fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="실적" fill="#0c1e3c" radius={[3, 3, 0, 0]} />
          <Bar dataKey="편성" fill="#94a3b8" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
