import { sapConnector } from '@/lib/sap-connector'
import { formatCurrency } from '@/lib/utils'
import WaterfallChart from '@/components/profitability/WaterfallChart'
import profitCentersData from '@/lib/mock-data/profit-centers.json'
import type { ProfitCenter } from '@/types'

export const dynamic = 'force-dynamic'

export default async function ProfitabilityPage({
  searchParams,
}: {
  searchParams: { fiscal_year?: string; fiscal_period?: string; profit_center_id?: string }
}) {
  const fiscal_year = Number(searchParams.fiscal_year ?? 2025)
  const fiscal_period = searchParams.fiscal_period ? Number(searchParams.fiscal_period) : undefined
  const profit_center_id = searchParams.profit_center_id || undefined
  const profitCenters = profitCentersData as ProfitCenter[]

  const segments = await sapConnector.getProfitabilitySegments({ fiscal_year, fiscal_period, profit_center_id })

  const totalRevenue = segments.reduce((s, r) => s + r.revenue, 0)
  const totalDirectCost = segments.reduce((s, r) => s + r.direct_cost, 0)
  const totalOverheadCost = segments.reduce((s, r) => s + r.overhead_cost, 0)
  const totalGrossProfit = segments.reduce((s, r) => s + r.gross_profit, 0)
  const totalGrossMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0

  // 본부별 집계
  const pcMap = new Map<string, { name: string; revenue: number; direct_cost: number; overhead_cost: number; gross_profit: number }>()
  for (const r of segments) {
    const key = r.profit_center.id
    const existing = pcMap.get(key)
    if (existing) {
      existing.revenue += r.revenue
      existing.direct_cost += r.direct_cost
      existing.overhead_cost += r.overhead_cost
      existing.gross_profit += r.gross_profit
    } else {
      pcMap.set(key, {
        name: r.profit_center.profit_center_name,
        revenue: r.revenue,
        direct_cost: r.direct_cost,
        overhead_cost: r.overhead_cost,
        gross_profit: r.gross_profit,
      })
    }
  }
  const pcList = Array.from(pcMap.values()).sort((a, b) => b.revenue - a.revenue)

  return (
    <div className="flex flex-col flex-1">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">수익성 분석</h2>
          <p className="text-sm text-slate-500 mt-0.5">CO-PA 기반 본부·프로젝트별 수익성 분석</p>
        </div>
      </header>

      <form className="flex flex-wrap items-center gap-3 px-6 py-3 bg-white border-b border-slate-100">
        <select name="fiscal_year" defaultValue={fiscal_year}
          className="text-sm border border-slate-200 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}년</option>)}
        </select>
        <select name="fiscal_period" defaultValue={fiscal_period ?? ''}
          className="text-sm border border-slate-200 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">전체</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((p) => <option key={p} value={p}>{p}월</option>)}
        </select>
        <select name="profit_center_id" defaultValue={profit_center_id ?? ''}
          className="text-sm border border-slate-200 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">전체 본부</option>
          {profitCenters.map((pc) => <option key={pc.id} value={pc.id}>{pc.profit_center_name}</option>)}
        </select>
        <button type="submit"
          className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          조회
        </button>
      </form>

      <div className="flex-1 p-6 space-y-6">
        {/* 전사 KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">총 매출</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">직접원가</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalDirectCost)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">간접비 배부</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalOverheadCost)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">매출총이익 (이익률)</p>
            <p className={`text-2xl font-bold mt-1 ${totalGrossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalGrossProfit)}
            </p>
            <p className="text-xs text-slate-500 mt-1">{totalGrossMargin.toFixed(1)}%</p>
          </div>
        </div>

        {/* Waterfall 차트 */}
        {segments.length > 0 && (
          <WaterfallChart
            revenue={totalRevenue}
            direct_cost={totalDirectCost}
            overhead_cost={totalOverheadCost}
            gross_profit={totalGrossProfit}
          />
        )}

        {/* 본부별 테이블 */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700">본부별 수익성</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">본부</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">매출</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">직접원가</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">간접비 배부</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">매출총이익</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">이익률</th>
                </tr>
              </thead>
              <tbody>
                {pcList.map((pc, i) => {
                  const margin = pc.revenue > 0 ? (pc.gross_profit / pc.revenue) * 100 : 0
                  return (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">{pc.name}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(pc.revenue)}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(pc.direct_cost)}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(pc.overhead_cost)}</td>
                      <td className={`px-4 py-3 text-right font-medium ${pc.gross_profit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                        {formatCurrency(pc.gross_profit)}
                      </td>
                      <td className={`px-4 py-3 text-right text-xs font-medium ${margin >= 20 ? 'text-green-600' : margin >= 10 ? 'text-yellow-600' : 'text-red-500'}`}>
                        {margin.toFixed(1)}%
                      </td>
                    </tr>
                  )
                })}
                {pcList.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">조회된 데이터가 없습니다.</td>
                  </tr>
                )}
              </tbody>
              {pcList.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-50 font-semibold">
                    <td className="px-4 py-3 text-slate-700">합계</td>
                    <td className="px-4 py-3 text-right text-slate-800">{formatCurrency(totalRevenue)}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(totalDirectCost)}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(totalOverheadCost)}</td>
                    <td className={`px-4 py-3 text-right ${totalGrossProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {formatCurrency(totalGrossProfit)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-600">{totalGrossMargin.toFixed(1)}%</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* 프로젝트별 상세 */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700">프로젝트별 수익성 상세</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">기간</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">본부</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">프로젝트</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">매출</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">직접원가</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">간접비</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">총이익</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">이익률</th>
                </tr>
              </thead>
              <tbody>
                {segments.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{s.fiscal_year}년 {s.fiscal_period}월</td>
                    <td className="px-4 py-3 text-slate-600">{s.profit_center.profit_center_name}</td>
                    <td className="px-4 py-3 text-slate-700">{s.project?.project_name ?? '-'}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(s.revenue)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(s.direct_cost)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(s.overhead_cost)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${s.gross_profit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {formatCurrency(s.gross_profit)}
                    </td>
                    <td className={`px-4 py-3 text-right text-xs ${(s.gross_margin * 100) >= 20 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {(s.gross_margin * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
