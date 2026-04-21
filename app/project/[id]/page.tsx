import { sapConnector } from '@/lib/sap-connector'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import StatusBadge from '@/components/common/StatusBadge'
import VarianceChart from '@/components/project/VarianceChart'
import projectsData from '@/lib/mock-data/projects.json'
import profitCentersData from '@/lib/mock-data/profit-centers.json'
import type { Project, ProfitCenter } from '@/types'

export const dynamic = 'force-dynamic'

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { fiscal_year?: string }
}) {
  const fiscal_year = Number(searchParams.fiscal_year ?? 2025)

  const actuals = await sapConnector.getProjectActuals({
    fiscal_year,
    project_id: params.id,
  })

  const allProjects = projectsData as (Project & { profit_center_id: string })[]
  const profitCenters = profitCentersData as ProfitCenter[]
  const projectRaw = allProjects.find((p) => p.id === params.id)
  const project = projectRaw
    ? {
        ...projectRaw,
        profit_center: profitCenters.find((pc) => pc.id === projectRaw.profit_center_id) ?? { id: '', profit_center_code: '', profit_center_name: '-' },
      }
    : null

  if (!project) {
    return (
      <div className="flex-1 p-6">
        <p className="text-slate-500">프로젝트를 찾을 수 없습니다.</p>
        <Link href="/project" className="text-blue-600 hover:underline text-sm mt-2 inline-block">← 목록으로</Link>
      </div>
    )
  }

  const totalActual = actuals.reduce((s, r) => s + r.actual_amount, 0)
  const totalPlan = actuals.reduce((s, r) => s + r.plan_amount, 0)
  const burnRate = project.budget_amount > 0 ? (totalActual / project.budget_amount) * 100 : 0

  // 원가요소별 집계
  const elementMap = new Map<string, { name: string; actual_amount: number; plan_amount: number; variance: number }>()
  for (const r of actuals) {
    const key = r.cost_element_name
    const existing = elementMap.get(key)
    if (existing) {
      existing.actual_amount += r.actual_amount
      existing.plan_amount += r.plan_amount
    } else {
      elementMap.set(key, { name: r.cost_element_name, actual_amount: r.actual_amount, plan_amount: r.plan_amount, variance: 0 })
    }
  }
  const elementList = Array.from(elementMap.values()).map((e) => ({
    ...e,
    variance: e.actual_amount - e.plan_amount,
  }))

  // 투입 원가센터별 집계
  const ccMap = new Map<string, { name: string; actual_amount: number }>()
  for (const r of actuals) {
    const key = r.cost_center_name
    const existing = ccMap.get(key)
    if (existing) {
      existing.actual_amount += r.actual_amount
    } else {
      ccMap.set(key, { name: r.cost_center_name, actual_amount: r.actual_amount })
    }
  }
  const ccList = Array.from(ccMap.values()).sort((a, b) => b.actual_amount - a.actual_amount)

  return (
    <div className="flex flex-col flex-1">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/project" className="text-slate-400 hover:text-slate-600">← 프로젝트 목록</Link>
          <span className="text-slate-300">/</span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-slate-800">{project.project_name}</h2>
              <StatusBadge status={project.status} />
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              {project.project_code} · {project.profit_center.profit_center_name} · PM: {project.project_manager}
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6 space-y-6">
        {/* KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">예산</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(project.budget_amount)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">총 실적</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalActual)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">잔여예산</p>
            <p className={`text-2xl font-bold mt-1 ${project.budget_amount - totalActual < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(project.budget_amount - totalActual)}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">소진율</p>
            <p className={`text-2xl font-bold mt-1 ${burnRate > 90 ? 'text-red-600' : burnRate > 70 ? 'text-yellow-600' : 'text-blue-600'}`}>
              {burnRate.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* 차트 */}
        {actuals.length > 0 && <VarianceChart actuals={actuals} />}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 원가요소별 */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700">원가요소별 상세</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">원가요소</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">실적</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">계획</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">차이</th>
                </tr>
              </thead>
              <tbody>
                {elementList.map((e, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="px-4 py-3 text-slate-700">{e.name}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">{formatCurrency(e.actual_amount)}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{formatCurrency(e.plan_amount)}</td>
                    <td className={`px-4 py-3 text-right text-xs font-medium ${e.variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {e.variance > 0 ? '+' : ''}{formatCurrency(e.variance)}
                    </td>
                  </tr>
                ))}
                {elementList.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">데이터 없음</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 투입 원가센터별 */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700">투입 원가센터별</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">원가센터</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">실적</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">비중</th>
                </tr>
              </thead>
              <tbody>
                {ccList.map((cc, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="px-4 py-3 text-slate-700">{cc.name}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">{formatCurrency(cc.actual_amount)}</td>
                    <td className="px-4 py-3 text-right text-xs text-slate-500">
                      {totalActual > 0 ? `${((cc.actual_amount / totalActual) * 100).toFixed(1)}%` : '-'}
                    </td>
                  </tr>
                ))}
                {ccList.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400">데이터 없음</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
