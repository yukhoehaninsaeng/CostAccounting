import { sapConnector } from '@/lib/sap-connector'
import { formatCurrency } from '@/lib/utils'
import profitCentersData from '@/lib/mock-data/profit-centers.json'
import type { ProfitCenter } from '@/types'

export const dynamic = 'force-dynamic'

export default async function ProfitCenterPage({
  searchParams,
}: {
  searchParams: { fiscal_year?: string; fiscal_period?: string }
}) {
  const fiscal_year = Number(searchParams.fiscal_year ?? 2025)
  const fiscal_period = searchParams.fiscal_period ? Number(searchParams.fiscal_period) : undefined
  const profitCenters = profitCentersData as ProfitCenter[]

  const [allActuals, allSegments] = await Promise.all([
    sapConnector.getCostCenterActuals({ fiscal_year, fiscal_period }),
    sapConnector.getProfitabilitySegments({ fiscal_year, fiscal_period }),
  ])

  // 이익센터(본부)별 집계
  const pcMap = new Map<
    string,
    {
      profit_center: ProfitCenter
      revenue: number
      cost: number
      gross_profit: number
      headcount: number
    }
  >()

  for (const pc of profitCenters) {
    pcMap.set(pc.id, { profit_center: pc, revenue: 0, cost: 0, gross_profit: 0, headcount: 0 })
  }

  for (const r of allActuals) {
    const pcId = r.cost_center.profit_center.id
    const existing = pcMap.get(pcId)
    if (existing) {
      existing.cost += r.actual_amount
      existing.headcount = Math.max(existing.headcount, r.headcount)
    }
  }

  for (const s of allSegments) {
    const pcId = s.profit_center.id
    const existing = pcMap.get(pcId)
    if (existing) {
      existing.revenue += s.revenue
    }
  }

  const pcList = Array.from(pcMap.values()).map((pc) => ({
    ...pc,
    gross_profit: pc.revenue - pc.cost,
    gross_margin: pc.revenue > 0 ? ((pc.revenue - pc.cost) / pc.revenue) * 100 : 0,
  })).sort((a, b) => b.revenue - a.revenue)

  const totalRevenue = pcList.reduce((s, pc) => s + pc.revenue, 0)
  const totalCost = pcList.reduce((s, pc) => s + pc.cost, 0)
  const totalProfit = totalRevenue - totalCost

  return (
    <div className="flex flex-col flex-1">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">이익센터 손익</h2>
          <p className="text-sm text-slate-500 mt-0.5">EC-PCA 기반 사업부별 손익 현황</p>
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
        <button type="submit"
          className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          조회
        </button>
      </form>

      <div className="flex-1 p-6 space-y-6">
        {/* 전사 요약 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">전사 매출</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">전사 원가</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalCost)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">전사 이익</p>
            <p className={`text-2xl font-bold mt-1 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalProfit)}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              이익률 {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>

        {/* 본부별 손익 테이블 */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700">본부별 손익 현황</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">본부</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">담당자</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">매출</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">원가</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">이익</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">이익률</th>
                  <th className="px-4 py-3 text-slate-500 font-medium">이익 비중</th>
                </tr>
              </thead>
              <tbody>
                {pcList.map((pc, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{pc.profit_center.profit_center_name}</div>
                      <div className="text-xs text-slate-400">{pc.profit_center.profit_center_code}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{pc.profit_center.manager ?? '-'}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(pc.revenue)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(pc.cost)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${pc.gross_profit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {formatCurrency(pc.gross_profit)}
                    </td>
                    <td className={`px-4 py-3 text-right text-xs font-medium ${pc.gross_margin >= 20 ? 'text-green-600' : pc.gross_margin >= 0 ? 'text-yellow-600' : 'text-red-500'}`}>
                      {pc.gross_margin.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${pc.gross_profit >= 0 ? 'bg-green-500' : 'bg-red-400'}`}
                            style={{
                              width: `${totalRevenue > 0 ? Math.min((Math.abs(pc.revenue) / totalRevenue) * 100, 100) : 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 w-8 text-right">
                          {totalRevenue > 0 ? ((pc.revenue / totalRevenue) * 100).toFixed(0) : 0}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-semibold">
                  <td className="px-4 py-3 text-slate-700" colSpan={2}>합계</td>
                  <td className="px-4 py-3 text-right text-slate-800">{formatCurrency(totalRevenue)}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(totalCost)}</td>
                  <td className={`px-4 py-3 text-right ${totalProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {formatCurrency(totalProfit)}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-slate-600">
                    {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%
                  </td>
                  <td className="px-4 py-3" />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
