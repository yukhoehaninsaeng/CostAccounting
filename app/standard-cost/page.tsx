import { sapConnector } from '@/lib/sap-connector'
import { formatCurrency } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const basisLabel: Record<string, string> = {
  HEADCOUNT: '인원수 기준',
  HOURS: '시간 기준',
  REVENUE: '매출 기준',
  DIRECT: '직접 배분',
}

export default async function StandardCostPage({
  searchParams,
}: {
  searchParams: { fiscal_year?: string; fiscal_period?: string }
}) {
  const fiscal_year = Number(searchParams.fiscal_year ?? 2025)
  const fiscal_period = searchParams.fiscal_period ? Number(searchParams.fiscal_period) : undefined

  const allocations = await sapConnector.getStandardCostAllocations({ fiscal_year, fiscal_period })
  const totalAllocated = allocations.reduce((s, a) => s + a.allocated_amount, 0)

  // 배분기준별 집계
  const basisMap = new Map<string, number>()
  for (const a of allocations) {
    basisMap.set(a.allocation_basis, (basisMap.get(a.allocation_basis) ?? 0) + a.allocated_amount)
  }

  return (
    <div className="flex flex-col flex-1">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">표준원가 배분</h2>
          <p className="text-sm text-slate-500 mt-0.5">CO-PC-PCP 기반 간접비 배분 결과</p>
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
        {/* 요약 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 lg:col-span-2">
            <p className="text-sm text-slate-500">총 배분 금액</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalAllocated)}</p>
          </div>
          {Array.from(basisMap.entries()).map(([basis, amount]) => (
            <div key={basis} className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-sm text-slate-500">{basisLabel[basis] ?? basis}</p>
              <p className="text-xl font-bold text-slate-700 mt-1">{formatCurrency(amount)}</p>
              <p className="text-xs text-slate-400 mt-1">
                {totalAllocated > 0 ? ((amount / totalAllocated) * 100).toFixed(0) : 0}%
              </p>
            </div>
          ))}
        </div>

        {/* 배분 상세 테이블 */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700">배분 상세 내역</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">배분 원가센터(From)</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">수혜 원가센터(To)</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">배분 기준</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">배분 비율</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">배분 금액</th>
                </tr>
              </thead>
              <tbody>
                {allocations.map((a) => (
                  <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{a.from_cost_center.cost_center_name}</div>
                      <div className="text-xs text-slate-400">{a.from_cost_center.cost_center_code}</div>
                    </td>
                    <td className="px-4 py-3">
                      {a.to_cost_center && (
                        <div>
                          <div className="font-medium text-slate-700">{a.to_cost_center.cost_center_name}</div>
                          <div className="text-xs text-slate-400">{a.to_cost_center.cost_center_code}</div>
                        </div>
                      )}
                      {a.to_project && (
                        <div>
                          <div className="font-medium text-slate-700">{a.to_project.project_name}</div>
                          <div className="text-xs text-slate-400">프로젝트</div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {basisLabel[a.allocation_basis] ?? a.allocation_basis}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{(a.allocation_ratio * 100).toFixed(1)}%</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">{formatCurrency(a.allocated_amount)}</td>
                  </tr>
                ))}
                {allocations.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">조회된 데이터가 없습니다.</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-semibold">
                  <td className="px-4 py-3 text-slate-700" colSpan={4}>합계</td>
                  <td className="px-4 py-3 text-right text-slate-800">{formatCurrency(totalAllocated)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* 차이 분석 설명 */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-blue-800 mb-3">표준원가 차이 분석 유형</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-blue-700">가격차이</p>
              <p className="text-blue-600 text-xs mt-1">실제 단가 vs 표준 단가의 차이. 구매·조달 부문 성과 반영.</p>
            </div>
            <div>
              <p className="font-medium text-blue-700">수량차이</p>
              <p className="text-blue-600 text-xs mt-1">실제 투입량 vs 표준 투입량의 차이. 생산·운영 효율성 반영.</p>
            </div>
            <div>
              <p className="font-medium text-blue-700">조업도차이</p>
              <p className="text-blue-600 text-xs mt-1">실제 조업도 vs 표준 조업도의 차이. 고정비 흡수율 반영.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
