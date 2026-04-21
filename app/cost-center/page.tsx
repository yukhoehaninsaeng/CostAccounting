import { sapConnector } from '@/lib/sap-connector'
import { formatCurrency, formatPercent } from '@/lib/utils'
import Link from 'next/link'
import profitCentersData from '@/lib/mock-data/profit-centers.json'
import type { ProfitCenter, CostCenterActual } from '@/types'

export const dynamic = 'force-dynamic'

export default async function CostCenterPage({
  searchParams,
}: {
  searchParams: { fiscal_year?: string; fiscal_period?: string; profit_center_id?: string }
}) {
  const fiscal_year = Number(searchParams.fiscal_year ?? 2025)
  const fiscal_period = searchParams.fiscal_period ? Number(searchParams.fiscal_period) : undefined
  const profit_center_id = searchParams.profit_center_id || undefined
  const profitCenters = profitCentersData as ProfitCenter[]

  const actuals = await sapConnector.getCostCenterActuals({ fiscal_year, fiscal_period, profit_center_id })

  // 원가센터별로 집계
  const ccMap = new Map<
    string,
    {
      cost_center_id: string
      cost_center_code: string
      cost_center_name: string
      profit_center_name: string
      cost_center_type: string
      actual_amount: number
      plan_amount: number
      variance: number
      variance_rate: number
      headcount: number
    }
  >()

  for (const r of actuals) {
    const key = r.cost_center.id
    const existing = ccMap.get(key)
    if (existing) {
      existing.actual_amount += r.actual_amount
      existing.plan_amount += r.plan_amount
      existing.headcount = Math.max(existing.headcount, r.headcount)
    } else {
      ccMap.set(key, {
        cost_center_id: r.cost_center.id,
        cost_center_code: r.cost_center.cost_center_code,
        cost_center_name: r.cost_center.cost_center_name,
        profit_center_name: r.cost_center.profit_center.profit_center_name,
        cost_center_type: r.cost_center.cost_center_type,
        actual_amount: r.actual_amount,
        plan_amount: r.plan_amount,
        variance: 0,
        variance_rate: 0,
        headcount: r.headcount,
      })
    }
  }

  const ccList = Array.from(ccMap.values()).map((cc) => ({
    ...cc,
    variance: cc.actual_amount - cc.plan_amount,
    variance_rate: cc.plan_amount !== 0 ? ((cc.actual_amount - cc.plan_amount) / cc.plan_amount) * 100 : 0,
  }))

  const typeLabel: Record<string, string> = {
    DIRECT: '직접',
    INDIRECT: '간접',
    ADMIN: '관리',
  }

  return (
    <div className="flex flex-col flex-1">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">원가센터 집계</h2>
            <p className="text-sm text-slate-500 mt-0.5">CO-OM-CCA 기반 원가센터별 실적 집계</p>
          </div>
        </div>
      </header>

      {/* 필터 */}
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
            <span className="text-sm text-slate-500">총 {ccList.length}개 원가센터</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">코드</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">원가센터명</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">본부</th>
                  <th className="text-center px-4 py-3 text-slate-500 font-medium">유형</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">실적</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">계획</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">차이</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">차이율</th>
                </tr>
              </thead>
              <tbody>
                {ccList.map((cc) => (
                  <tr key={cc.cost_center_id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{cc.cost_center_code}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/cost-center/${cc.cost_center_id}?fiscal_year=${fiscal_year}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {cc.cost_center_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{cc.profit_center_name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        cc.cost_center_type === 'DIRECT' ? 'bg-blue-100 text-blue-700' :
                        cc.cost_center_type === 'INDIRECT' ? 'bg-purple-100 text-purple-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {typeLabel[cc.cost_center_type] ?? cc.cost_center_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">{formatCurrency(cc.actual_amount)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(cc.plan_amount)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${cc.variance > 0 ? 'text-red-600' : cc.variance < 0 ? 'text-green-600' : 'text-slate-400'}`}>
                      {cc.variance > 0 ? '+' : ''}{formatCurrency(cc.variance)}
                    </td>
                    <td className={`px-4 py-3 text-right text-xs ${cc.variance_rate > 0 ? 'text-red-500' : cc.variance_rate < 0 ? 'text-green-500' : 'text-slate-400'}`}>
                      {cc.variance_rate > 0 ? '+' : ''}{cc.variance_rate.toFixed(1)}%
                    </td>
                  </tr>
                ))}
                {ccList.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">조회된 데이터가 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
