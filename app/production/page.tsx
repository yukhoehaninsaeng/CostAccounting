import { sapConnector } from '@/lib/sap-connector'
import Header from '@/components/layout/Header'
import KpiCard from '@/components/common/KpiCard'
import ProdTable from '@/components/production/ProdTable'
import ExportButton from '@/components/common/ExportButton'
import { fmtKRW, fmtKRWFull, fmtRate } from '@/lib/utils/format'

export const dynamic = 'force-dynamic'

export default async function ProductionPage({
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

  const [items, summary] = await Promise.all([
    sapConnector.getProduction(params),
    sapConnector.getProductionSummary(params),
  ])

  const qtyDelta = summary.plan_qty > 0
    ? ((summary.actual_qty - summary.plan_qty) / summary.plan_qty) * 100
    : 0
  const amtDelta = summary.plan_amt > 0
    ? ((summary.actual_amt - summary.plan_amt) / summary.plan_amt) * 100
    : 0

  const exportData = items.map((r) => ({
    자재코드: r.matnr,
    제품명: r.product_name,
    제품군: r.model_group,
    실적수량: r.actual_qty,
    실적금액: r.actual_amount,
    실적재료비: r.actual_mat_cost,
    실적재료비율: r.actual_mat_rate,
    편성수량: r.plan_qty,
    편성금액: r.plan_amount,
    편성재료비율: r.plan_mat_rate,
    수량차이: r.qty_variance,
    금액차이: r.amt_variance,
  }))

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header />

      <div className="p-6 space-y-5">
        {/* Row 1 — 요약 바 */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            label="생산수량 (실적)"
            value={`${summary.actual_qty.toLocaleString('ko-KR')} EA`}
            sub={`편성 ${summary.plan_qty.toLocaleString('ko-KR')} EA`}
            delta={qtyDelta}
            deltaType="rate"
            deltaLabel={`달성률 ${fmtRate(summary.achievement_rate)}`}
          />
          <KpiCard
            label="생산금액 (실적)"
            value={fmtKRW(summary.actual_amt)}
            sub={fmtKRWFull(summary.actual_amt)}
            delta={amtDelta}
            deltaType="rate"
            deltaLabel={`편성 ${fmtKRW(summary.plan_amt)} 대비`}
          />
          <KpiCard
            label="재료비"
            value={fmtKRW(summary.mat_cost)}
            sub={fmtKRWFull(summary.mat_cost)}
            delta={summary.mat_rate - 45}
            deltaType="rate"
            deltaLabel={`재료비율 ${fmtRate(summary.mat_rate)}`}
            isInverse
          />
          <KpiCard
            label="편성 달성률"
            value={fmtRate(summary.achievement_rate)}
            sub={`목표 100.0%`}
            delta={summary.achievement_rate - 100}
            deltaType="rate"
            className={summary.achievement_rate < 90 ? 'border-red-300 bg-red-50' : ''}
          />
        </div>

        {/* Row 3 — 상세 테이블 */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700">완제품별 생산금액 산출</h3>
            <ExportButton data={exportData} filename="생산금액산출" />
          </div>
          <ProdTable items={items} />
        </div>
      </div>
    </div>
  )
}
