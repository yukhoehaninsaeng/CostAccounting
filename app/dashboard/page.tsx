import { sapConnector } from '@/lib/sap-connector'
import Header from '@/components/layout/Header'
import KpiCard from '@/components/common/KpiCard'
import StatusBadge from '@/components/common/StatusBadge'
import ProductGroupChart from '@/components/dashboard/ProductGroupChart'
import InventoryCompositionBar from '@/components/dashboard/InventoryCompositionBar'
import { fmtKRW, fmtKRWFull, fmtQty, fmtRate } from '@/lib/utils/format'
import { COMPANIES, COMPANY_LIST } from '@/lib/companies'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { year?: string; period?: string; model?: string; plant?: string; bukrs?: string }
}) {
  const params = {
    year: Number(searchParams.year ?? 2025),
    period: Number(searchParams.period ?? 12),
    model: searchParams.model ?? 'all',
    plant: searchParams.plant ?? 'all',
    bukrs: searchParams.bukrs ?? 'all',
  }

  const [kpi, chartData, composition, topProducts, companySummaries] = await Promise.all([
    sapConnector.getDashboardKpi(params),
    sapConnector.getDashboardChartData(params),
    sapConnector.getInventoryComposition(params),
    sapConnector.getProduction(params).then((items) =>
      items.sort((a, b) => b.actual_amount - a.actual_amount).slice(0, 10)
    ),
    sapConnector.getCompanySummaries(params),
  ])

  const prodAmtDelta = kpi.production_amount.plan > 0
    ? ((kpi.production_amount.actual - kpi.production_amount.plan) / kpi.production_amount.plan) * 100
    : 0
  const prodQtyDelta = kpi.production_qty.plan > 0
    ? ((kpi.production_qty.actual - kpi.production_qty.plan) / kpi.production_qty.plan) * 100
    : 0

  const activeBukrs = params.bukrs === 'all' ? COMPANY_LIST.map((c) => c.bukrs) : [params.bukrs]

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header />

      <div className="p-5 space-y-4">

        {/* ── 회사코드 요약 카드 ── */}
        <div className="grid grid-cols-3 gap-3">
          {COMPANY_LIST.map((co) => {
            const s = companySummaries.find((x) => x.bukrs === co.bukrs)
            const isActive = activeBukrs.includes(co.bukrs)
            const ach = s && s.plan_qty > 0 ? (s.prod_qty / s.plan_qty) * 100 : 0

            return (
              <div
                key={co.bukrs}
                className={`rounded-xl border border-slate-200 p-4 transition-opacity ${isActive ? 'opacity-100' : 'opacity-30'}`}
                style={{ borderLeftWidth: 3, borderLeftColor: isActive ? co.color : '#e2e8f0' }}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded"
                    style={{ background: co.bgColor, color: co.textColor }}
                  >
                    {co.bukrs}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">{co.name}</span>
                </div>
                {s ? (
                  <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-slate-100">
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">생산금액</p>
                      <p className="text-sm font-bold text-slate-800">{fmtKRW(s.prod_amt)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">재료비율</p>
                      <p
                        className="text-sm font-bold"
                        style={{ color: s.mat_rate > 55 ? '#b91c1c' : s.mat_rate > 45 ? '#92400e' : '#166534' }}
                      >
                        {fmtRate(s.mat_rate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">달성률</p>
                      <p className={`text-sm font-bold ${ach < 85 ? 'text-red-700' : 'text-slate-800'}`}>
                        {fmtRate(ach)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-300 pt-2">데이터 없음</p>
                )}
              </div>
            )
          })}
        </div>

        {/* ── KPI 카드 4열 ── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
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
            deltaLabel={`달성률 ${fmtRate((kpi.production_qty.actual / Math.max(1, kpi.production_qty.plan)) * 100)}`}
          />
          <KpiCard
            label="재고자산 합계"
            value={fmtKRW(kpi.inventory_total)}
            sub="완제품+재공품+자재"
          />
        </div>

        {/* ── 차트 행 ── */}
        <div className="grid grid-cols-5 gap-3">
          <div className="col-span-3">
            <ProductGroupChart data={chartData} />
          </div>
          <div className="col-span-2">
            <InventoryCompositionBar data={composition} chartData={chartData} />
          </div>
        </div>

        {/* ── 완제품별 생산금액 현황 ── */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">완제품별 생산금액 현황</h3>
            <Link href="/production" className="text-xs text-blue-600 hover:underline">
              전체 보기 →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-center px-3 py-2.5 text-xs text-slate-500 font-medium">회사</th>
                  <th className="text-left px-3 py-2.5 text-xs text-slate-500 font-medium">자재코드</th>
                  <th className="text-left px-3 py-2.5 text-xs text-slate-500 font-medium">제품명</th>
                  <th className="text-center px-3 py-2.5 text-xs text-slate-500 font-medium">유형</th>
                  <th className="text-right px-3 py-2.5 text-xs text-slate-500 font-medium">생산수량</th>
                  <th className="text-right px-3 py-2.5 text-xs text-slate-500 font-medium">생산금액</th>
                  <th className="text-right px-3 py-2.5 text-xs text-slate-500 font-medium">재료비</th>
                  <th className="px-3 py-2.5 text-xs text-slate-500 font-medium min-w-[130px]">재료비율</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((pj, i) => {
                  const co = pj.bukrs ? COMPANIES[pj.bukrs] : null
                  return (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2.5 text-center">
                        {co && (
                          <span
                            className="inline-flex px-1.5 py-0.5 rounded text-xs font-bold"
                            style={{ background: co.bgColor, color: co.textColor }}
                          >
                            {co.bukrs}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <Link
                          href={`/bom/${pj.matnr}`}
                          className="font-mono text-xs text-blue-700 hover:underline font-medium"
                        >
                          {pj.matnr}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 text-slate-800 font-medium">{pj.product_name}</td>
                      <td className="px-3 py-2.5 text-center">
                        <StatusBadge type="FERT" />
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-700">
                        {pj.actual_qty.toLocaleString('ko-KR')} EA
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium text-slate-800" title={fmtKRWFull(pj.actual_amount)}>
                        {fmtKRW(pj.actual_amount)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-600" title={fmtKRWFull(pj.actual_mat_cost)}>
                        {fmtKRW(pj.actual_mat_cost)}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${pj.actual_mat_rate > 55 ? 'bg-red-400' : pj.actual_mat_rate > 45 ? 'bg-yellow-400' : 'bg-blue-500'}`}
                              style={{ width: `${Math.min(pj.actual_mat_rate, 100)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-semibold w-10 text-right ${pj.actual_mat_rate > 55 ? 'text-red-600' : 'text-slate-600'}`}>
                            {fmtRate(pj.actual_mat_rate)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
