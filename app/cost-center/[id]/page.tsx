import { sapConnector } from '@/lib/sap-connector'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import CostCenterMonthlyChart from '@/components/cost-center/CostCenterMonthlyChart'

export const dynamic = 'force-dynamic'

export default async function CostCenterDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { fiscal_year?: string }
}) {
  const fiscal_year = Number(searchParams.fiscal_year ?? 2025)

  const actuals = await sapConnector.getCostCenterActuals({
    fiscal_year,
    cost_center_id: params.id,
  })

  const costCenter = actuals[0]?.cost_center
  if (!costCenter) {
    return (
      <div className="flex-1 p-6">
        <p className="text-slate-500">데이터가 없습니다.</p>
        <Link href="/cost-center" className="text-blue-600 hover:underline text-sm mt-2 inline-block">← 목록으로</Link>
      </div>
    )
  }

  // 원가요소별 집계
  const elementMap = new Map<
    string,
    { element_name: string; element_category: string; actual_amount: number; plan_amount: number; variance: number }
  >()
  for (const r of actuals) {
    const key = r.cost_element.id
    const existing = elementMap.get(key)
    if (existing) {
      existing.actual_amount += r.actual_amount
      existing.plan_amount += r.plan_amount
    } else {
      elementMap.set(key, {
        element_name: r.cost_element_name,
        element_category: r.cost_element_category,
        actual_amount: r.actual_amount,
        plan_amount: r.plan_amount,
        variance: 0,
      })
    }
  }
  const elementList = Array.from(elementMap.values()).map((e) => ({
    ...e,
    variance: e.actual_amount - e.plan_amount,
    variance_rate: e.plan_amount !== 0 ? ((e.actual_amount - e.plan_amount) / e.plan_amount) * 100 : 0,
  }))

  const totalActual = elementList.reduce((s, e) => s + e.actual_amount, 0)
  const totalPlan = elementList.reduce((s, e) => s + e.plan_amount, 0)

  const categoryLabel: Record<string, string> = {
    LABOR: '인건비',
    MATERIAL: '재료비',
    OVERHEAD: '간접비',
    DEPRECIATION: '감가상각',
  }

  return (
    <div className="flex flex-col flex-1">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/cost-center" className="text-slate-400 hover:text-slate-600">
            ← 원가센터 목록
          </Link>
          <span className="text-slate-300">/</span>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">{costCenter.cost_center_name}</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {costCenter.cost_center_code} · {costCenter.profit_center.profit_center_name} · {fiscal_year}년
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6 space-y-6">
        {/* 요약 카드 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">총 실적</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalActual)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">총 계획</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalPlan)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">차이 (실적 - 계획)</p>
            <p className={`text-2xl font-bold mt-1 ${totalActual - totalPlan > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {totalActual - totalPlan > 0 ? '+' : ''}{formatCurrency(totalActual - totalPlan)}
            </p>
          </div>
        </div>

        {/* 월별 차트 */}
        <CostCenterMonthlyChart actuals={actuals} />

        {/* 원가요소별 breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700">원가요소별 상세</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">원가요소</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">유형</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">실적</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">계획</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">차이</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">차이율</th>
                </tr>
              </thead>
              <tbody>
                {elementList.map((e, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{e.element_name}</td>
                    <td className="px-4 py-3 text-slate-500">{categoryLabel[e.element_category] ?? e.element_category}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">{formatCurrency(e.actual_amount)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(e.plan_amount)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${e.variance > 0 ? 'text-red-600' : e.variance < 0 ? 'text-green-600' : 'text-slate-400'}`}>
                      {e.variance > 0 ? '+' : ''}{formatCurrency(e.variance)}
                    </td>
                    <td className={`px-4 py-3 text-right text-xs ${e.variance_rate > 0 ? 'text-red-500' : e.variance_rate < 0 ? 'text-green-500' : 'text-slate-400'}`}>
                      {e.variance_rate > 0 ? '+' : ''}{e.variance_rate.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-semibold">
                  <td className="px-4 py-3 text-slate-700" colSpan={2}>합계</td>
                  <td className="px-4 py-3 text-right text-slate-800">{formatCurrency(totalActual)}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(totalPlan)}</td>
                  <td className={`px-4 py-3 text-right ${totalActual - totalPlan > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {totalActual - totalPlan > 0 ? '+' : ''}{formatCurrency(totalActual - totalPlan)}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-slate-500">
                    {totalPlan !== 0 ? `${(((totalActual - totalPlan) / totalPlan) * 100).toFixed(1)}%` : '-'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
