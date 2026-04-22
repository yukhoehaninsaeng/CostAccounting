'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface MonthlyTrend {
  fiscal_period: number
  actual_amount: number
  plan_amount: number
}

interface CostTrendChartProps {
  data: MonthlyTrend[]
}

function formatAxisValue(value: number) {
  if (value >= 100000000) return `${(value / 100000000).toFixed(0)}억`
  if (value >= 10000000) return `${(value / 10000000).toFixed(0)}천만`
  return `${(value / 1000000).toFixed(0)}백만`
}

export default function CostTrendChart({ data }: CostTrendChartProps) {
  const chartData = data.map((d) => ({
    name: `${d.fiscal_period}월`,
    실적: d.actual_amount,
    계획: d.plan_amount,
  }))

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">월별 원가 추이</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={formatAxisValue} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{ fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="실적" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
          <Line
            type="monotone"
            dataKey="계획"
            stroke="#94a3b8"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
