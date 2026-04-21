import { sapConnector } from '@/lib/sap-connector'
import KpiCard from '@/components/dashboard/KpiCard'
import CostTrendChart from '@/components/dashboard/CostTrendChart'
import DivisionCostChart from '@/components/dashboard/DivisionCostChart'
import { formatCurrency, formatPercent } from '@/lib/utils'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { fiscal_year?: string; fiscal_period?: string }
}) {
  const fiscal_year = Number(searchParams.fiscal_year ?? 2025)
  const fiscal_period = searchParams.fiscal_period ? Number(searchParams.fiscal_period) : undefined

  const kpi = await sapConnector.getDashboardKpi({ fiscal_year, fiscal_period })

  return (
    <div className="flex flex-col flex-1">
      {/* 헤더 */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">전사 원가 대시보드</h2>
            <p className="text-sm text-slate-500 mt-0.5">{fiscal_year}년 {fiscal_period ? `${fiscal_period}월` : '연간'} 집계</p>
          </div>
          <div className="flex items-center gap-3">
            <form className="flex items-center gap-2">
              <select
                name="fiscal_year"
                defaultValue={fiscal_year}
                className="text-sm border border-slate-200 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[2024, 2025, 2026].map((y) => (
                  <option key={y} value={y}>{y}년</option>
                ))}
              </select>
              <select
                name="fiscal_period"
                defaultValue={fiscal_period ?? ''}
                className="text-sm border border-slate-200 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">전체</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((p) => (
                  <option key={p} value={p}>{p}월</option>
                ))}
              </select>
              <button
                type="submit"
                className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                조회
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6 space-y-6">
        {/* KPI 카드 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="총 실적원가"
            value={kpi.total_actual_cost}
            format="currency"
            subValue="누적 집계"
          />
          <KpiCard
            title="총 계획원가"
            value={kpi.total_plan_cost}
            format="currency"
            subValue="예산 기준"
          />
          <KpiCard
            title="계획 대비 차이"
            value={kpi.total_variance}
            format="currency"
            trend={kpi.variance_rate}
            subValue={`차이율 ${kpi.variance_rate.toFixed(1)}%`}
          />
          <KpiCard
            title="활성 프로젝트"
            value={kpi.active_project_count}
            format="count"
            subValue="진행중"
          />
        </div>

        {/* 차트 영역 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CostTrendChart data={kpi.monthly_trend} />
          <DivisionCostChart data={kpi.cost_by_division} />
        </div>

        {/* 상위 프로젝트 Top 5 */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">원가 상위 프로젝트 Top 5</h3>
            <Link
              href="/project"
              className="text-xs text-blue-600 hover:underline"
            >
              전체 보기 →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">프로젝트</th>
                  <th className="text-right px-5 py-3 text-slate-500 font-medium">예산</th>
                  <th className="text-right px-5 py-3 text-slate-500 font-medium">실적</th>
                  <th className="px-5 py-3 text-slate-500 font-medium">소진율</th>
                </tr>
              </thead>
              <tbody>
                {kpi.top_projects.map((pj, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-800">{pj.project_name}</div>
                      <div className="text-xs text-slate-400">{pj.project_code}</div>
                    </td>
                    <td className="px-5 py-3 text-right text-slate-600">{formatCurrency(pj.budget_amount)}</td>
                    <td className="px-5 py-3 text-right font-medium text-slate-800">{formatCurrency(pj.actual_amount)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${pj.burn_rate > 90 ? 'bg-red-500' : pj.burn_rate > 70 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min(pj.burn_rate, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 w-12 text-right">{pj.burn_rate.toFixed(0)}%</span>
                      </div>
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
