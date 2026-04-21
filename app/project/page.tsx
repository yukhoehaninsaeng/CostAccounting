import { sapConnector } from '@/lib/sap-connector'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import StatusBadge from '@/components/common/StatusBadge'
import profitCentersData from '@/lib/mock-data/profit-centers.json'
import projectsData from '@/lib/mock-data/projects.json'
import type { ProfitCenter, Project } from '@/types'

export const dynamic = 'force-dynamic'

export default async function ProjectPage({
  searchParams,
}: {
  searchParams: { fiscal_year?: string; fiscal_period?: string; profit_center_id?: string }
}) {
  const fiscal_year = Number(searchParams.fiscal_year ?? 2025)
  const fiscal_period = searchParams.fiscal_period ? Number(searchParams.fiscal_period) : undefined
  const profit_center_id = searchParams.profit_center_id || undefined
  const profitCenters = profitCentersData as ProfitCenter[]
  const allProjects = projectsData as Project[]

  const actuals = await sapConnector.getProjectActuals({ fiscal_year, fiscal_period, profit_center_id })

  // 프로젝트별 집계
  const projectMap = new Map<
    string,
    { project: Project; actual_amount: number; plan_amount: number }
  >()
  for (const r of actuals) {
    const key = r.project.id
    const existing = projectMap.get(key)
    if (existing) {
      existing.actual_amount += r.actual_amount
      existing.plan_amount += r.plan_amount
    } else {
      projectMap.set(key, {
        project: r.project,
        actual_amount: r.actual_amount,
        plan_amount: r.plan_amount,
      })
    }
  }

  // profit_center 필터가 있으면 해당 본부 프로젝트만, 없으면 전체
  const filteredProjects = allProjects.filter((p) => {
    if (profit_center_id && p.profit_center_id !== profit_center_id) return false
    return true
  })

  // 실적이 없는 프로젝트도 포함
  const projectList = filteredProjects.map((pj) => {
    const data = projectMap.get(pj.id)
    const actual_amount = data?.actual_amount ?? 0
    const plan_amount = data?.plan_amount ?? 0
    const burn_rate = pj.budget_amount > 0 ? (actual_amount / pj.budget_amount) * 100 : 0
    return {
      ...pj,
      actual_amount,
      plan_amount,
      remaining: pj.budget_amount - actual_amount,
      burn_rate,
      profit_center: profitCenters.find((pc) => pc.id === pj.profit_center_id) ?? { profit_center_name: '-', id: '', profit_center_code: '' },
    }
  }).sort((a, b) => b.actual_amount - a.actual_amount)

  return (
    <div className="flex flex-col flex-1">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">프로젝트 원가</h2>
          <p className="text-sm text-slate-500 mt-0.5">CO-PC 기반 프로젝트별 원가 집계</p>
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

      <div className="flex-1 p-6">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <span className="text-sm text-slate-500">총 {projectList.length}개 프로젝트</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">프로젝트</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">담당본부</th>
                  <th className="text-center px-4 py-3 text-slate-500 font-medium">상태</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">예산</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">실적</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">잔여예산</th>
                  <th className="px-4 py-3 text-slate-500 font-medium">소진율</th>
                </tr>
              </thead>
              <tbody>
                {projectList.map((pj) => (
                  <tr key={pj.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/project/${pj.id}?fiscal_year=${fiscal_year}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {pj.project_name}
                      </Link>
                      <div className="text-xs text-slate-400">{pj.project_code}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{pj.profit_center.profit_center_name}</td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={pj.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(pj.budget_amount)}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">{formatCurrency(pj.actual_amount)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${pj.remaining < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                      {formatCurrency(pj.remaining)}
                    </td>
                    <td className="px-4 py-3 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${pj.burn_rate > 90 ? 'bg-red-500' : pj.burn_rate > 70 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min(pj.burn_rate, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 w-10 text-right">{pj.burn_rate.toFixed(0)}%</span>
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
