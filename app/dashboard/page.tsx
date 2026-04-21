import { sapConnector } from '@/lib/sap-connector'
import Header from '@/components/layout/Header'
import KpiCard from '@/components/common/KpiCard'
import StatusBadge from '@/components/common/StatusBadge'
import ProductGroupChart from '@/components/dashboard/ProductGroupChart'
import InventoryCompositionBar from '@/components/dashboard/InventoryCompositionBar'
import { fmtKRW, fmtKRWFull, fmtQty, fmtRate } from '@/lib/utils/format'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { year?: string; period?: string; model?: string; plant?: string }
}) {
  const params = {
    year: Number(searchParams.year ?? 2025),
    period: Number(searchParams.period ?? 12),
    model: searchParams.model ?? 'all',
    plant: searchParams.plant ?? '4000',
  }

  const [kpi, chartData, composition, topProducts] = await Promise.all([
    sapConnector.getDashboardKpi(params),
    sapConnector.getDashboardChartData(params),
    sapConnector.getInventoryComposition(params),
    sapConnector.getProduction(params).then((items) =>
      items.sort((a, b) => b.actual_amount - a.actual_amount).slice(0, 8)
    ),
  ])

  const prodAmtDelta = kpi.production_amount.plan > 0
    ? ((kpi.production_amount.actual - kpi.production_amount.plan) / kpi.production_amount.plan) * 100
    : 0
  const prodQtyDelta = kpi.production_qty.plan > 0
    ? ((kpi.production_qty.actual - kpi.production_qty.plan) / kpi.production_qty.plan) * 100
    : 0

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header />

      <div className="p-6 space-y-6">
        {/* Row 1 — KPI 카드 4열 */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            label="생산금액 (실적)"
            value={fmtKRW(kpi.production_amount.actual)}
            sub={fmtKRWFull(kpi.production_amount.actual)}
            delta={prodAmtDelta}
            deltaType="rate"
            deltaLabel={`편성 ${fmtKRW(kpi.production_amount.plan)} 대비`}
          />
          <KpiCard
            label="재료비"
            value={fmtKRW(kpi.material_cost.actual)}
            sub={fmtKRWFull(kpi.material_cost.actual)}
            delta={kpi.material_cost.rate - 45}
            deltaType="rate"
            deltaLabel={`재료비율 ${fmtRate(kpi.material_cost.rate)}`}
            isInverse
          />
          <KpiCard
            label="생산수량 (누계)"
            value={fmtQty(kpi.production_qty.actual)}
            sub={`편성 ${kpi.production_qty.plan.toLocaleString('ko-KR')} EA`}
            delta={prodQtyDelta}
            deltaType="rate"
            deltaLabel={`달성률 ${fmtRate((kpi.production_qty.actual / kpi.production_qty.plan) * 100)}`}
          />
          <KpiCard
            label="재고자산 합계"
            value={fmtKRW(kpi.inventory_total)}
            sub={`완제품+재공품+자재`}
          />
        </div>

        {/* Row 2 — 차트 2열 (3:2) */}
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-3">
            <ProductGroupChart data={chartData} />
          </div>
          <div className="col-span-2">
            <InventoryCompositionBar data={composition} chartData={chartData} />
          </div>
        </div>

        {/* Row 3 — 완제품 Top 8 테이블 */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">완제품 생산금액 Top 8</h3>
            <Link href="/production" className="text-xs text-blue-600 hover:underline">
              전체 보기 →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-2.5 text-xs text-slate-500 font-medium">자재코드</th>
                  <th className="text-left px-4 py-2.5 text-xs text-slate-500 font-medium">제품명</th>
                  <th className="text-center px-4 py-2.5 text-xs text-slate-500 font-medium">유형</th>
                  <th className="text-right px-4 py-2.5 text-xs text-slate-500 font-medium">생산수량</th>
                  <th className="text-right px-4 py-2.5 text-xs text-slate-500 font-medium">생산금액</th>
                  <th className="text-right px-4 py-2.5 text-xs text-slate-500 font-medium">재료비</th>
                  <th className="px-4 py-2.5 text-xs text-slate-500 font-medium">재료비율</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((pj, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/bom/${pj.matnr}`}
                        className="font-mono text-xs text-blue-700 hover:underline font-medium"
                      >
                        {pj.matnr}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-slate-800 font-medium">{pj.product_name}</td>
                    <td className="px-4 py-2.5 text-center">
                      <StatusBadge type="FERT" />
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-700">
                      {pj.actual_qty.toLocaleString('ko-KR')} EA
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-slate-800" title={fmtKRWFull(pj.actual_amount)}>
                      {fmtKRW(pj.actual_amount)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-600" title={fmtKRWFull(pj.actual_mat_cost)}>
                      {fmtKRW(pj.actual_mat_cost)}
                    </td>
                    <td className="px-4 py-2.5 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${pj.actual_mat_rate > 55 ? 'bg-red-400' : pj.actual_mat_rate > 45 ? 'bg-yellow-400' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min(pj.actual_mat_rate, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-600 w-12 text-right font-medium">
                          {fmtRate(pj.actual_mat_rate)}
                        </span>
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
