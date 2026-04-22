'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface WaterfallItem {
  name: string
  value: number
  type: 'positive' | 'negative' | 'total'
  start: number
}

interface Props {
  revenue: number
  direct_cost: number
  overhead_cost: number
  gross_profit: number
}

export default function WaterfallChart({ revenue, direct_cost, overhead_cost, gross_profit }: Props) {
  const data: WaterfallItem[] = [
    { name: '매출', value: revenue, type: 'positive', start: 0 },
    { name: '직접원가', value: -direct_cost, type: 'negative', start: revenue - direct_cost },
    { name: '간접비 배부', value: -overhead_cost, type: 'negative', start: revenue - direct_cost - overhead_cost },
    { name: '매출총이익', value: gross_profit, type: 'total', start: 0 },
  ]

  function formatAxisValue(value: number) {
    if (value >= 100000000) return `${(value / 100000000).toFixed(1)}억`
    return `${(value / 10000000).toFixed(0)}천만`
  }

  const colors: Record<WaterfallItem['type'], string> = {
    positive: '#3b82f6',
    negative: '#f87171',
    total: '#10b981',
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">수익성 Waterfall 분석</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={formatAxisValue} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value: number) => [formatCurrency(Math.abs(value)), '']}
            contentStyle={{ fontSize: 12 }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={colors[entry.type]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500 inline-block" /> 수익</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400 inline-block" /> 비용</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> 이익</span>
      </div>
    </div>
  )
}
