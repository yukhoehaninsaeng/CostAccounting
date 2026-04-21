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

interface DivisionCost {
  profit_center_name: string
  actual_amount: number
  plan_amount: number
}

interface DivisionCostChartProps {
  data: DivisionCost[]
}

function shortName(name: string) {
  return name.replace('본부', '').replace('솔루션', '').slice(0, 6)
}

function formatAxisValue(value: number) {
  if (value >= 100000000) return `${(value / 100000000).toFixed(0)}억`
  return `${(value / 10000000).toFixed(0)}천만`
}

export default function DivisionCostChart({ data }: DivisionCostChartProps) {
  const chartData = data.map((d) => ({
    name: shortName(d.profit_center_name),
    실적: d.actual_amount,
    계획: d.plan_amount,
  }))

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">본부별 원가 현황</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={formatAxisValue} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{ fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="실적" fill="#3b82f6" radius={[3, 3, 0, 0]} />
          <Bar dataKey="계획" fill="#cbd5e1" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
