import { fmtKRW, fmtRate } from '@/lib/utils/format'
import type { InventoryComposition } from '@/types'

interface Props {
  data: InventoryComposition
  chartData: { model_group: string; mat_rate: number }[]
}

export default function InventoryCompositionBar({ data, chartData }: Props) {
  const total = data.fert_amt + data.halb_amt + data.roh_amt
  const fertPct = total > 0 ? (data.fert_amt / total) * 100 : 0
  const halbPct = total > 0 ? (data.halb_amt / total) * 100 : 0
  const rohPct = total > 0 ? (data.roh_amt / total) * 100 : 0

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
      {/* 재고 구성 */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">재고 구성</h3>
        <div className="flex h-5 rounded-full overflow-hidden gap-0.5">
          <div className="bg-green-500 transition-all" style={{ width: `${fertPct}%` }} title={`완제품 ${fertPct.toFixed(0)}%`} />
          <div className="bg-blue-500 transition-all" style={{ width: `${halbPct}%` }} title={`재공품 ${halbPct.toFixed(0)}%`} />
          <div className="bg-orange-400 transition-all" style={{ width: `${rohPct}%` }} title={`자재 ${rohPct.toFixed(0)}%`} />
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-600">
          {[
            { label: '완제품', pct: fertPct, amt: data.fert_amt, color: 'bg-green-500' },
            { label: '재공품', pct: halbPct, amt: data.halb_amt, color: 'bg-blue-500' },
            { label: '자재', pct: rohPct, amt: data.roh_amt, color: 'bg-orange-400' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${item.color}`} />
              <span className="text-slate-500">{item.label}</span>
              <span className="font-medium text-slate-700">{item.pct.toFixed(0)}%</span>
              <span className="text-slate-400 hidden sm:inline">({fmtKRW(item.amt)})</span>
            </div>
          ))}
        </div>
      </div>

      {/* 제품군별 재료비율 */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">제품군별 재료비율</h3>
        <div className="space-y-2">
          {chartData.map((d) => {
            const label =
              d.model_group === 'STON-S' ? 'STON-S' :
              d.model_group === 'STON-CART' ? 'STON+(카트)' : 'STON+'
            const rate = d.mat_rate
            return (
              <div key={d.model_group} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-20 flex-shrink-0">{label}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${rate > 55 ? 'bg-red-400' : rate > 45 ? 'bg-yellow-400' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(rate, 100)}%` }}
                  />
                </div>
                <span className={`text-xs font-semibold w-12 text-right ${rate > 55 ? 'text-red-600' : 'text-slate-700'}`}>
                  {rate.toFixed(1)}%
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
