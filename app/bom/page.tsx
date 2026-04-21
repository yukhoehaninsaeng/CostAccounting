import { sapConnector } from '@/lib/sap-connector'
import Header from '@/components/layout/Header'
import KpiCard from '@/components/common/KpiCard'
import StatusBadge from '@/components/common/StatusBadge'
import { fmtKRW, fmtRate } from '@/lib/utils/format'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function BomPage({
  searchParams,
}: {
  searchParams: { plant?: string }
}) {
  const plant = searchParams.plant ?? '4000'
  const summary = await sapConnector.getBomSummary(plant)

  const byGroup = (group: string) => summary.filter((s) => s.model_group === group)
  const avgMatRate = (group: string) => {
    const items = byGroup(group)
    return items.length > 0
      ? items.reduce((s, r) => s + r.material_rate, 0) / items.length
      : 0
  }

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header />

      <div className="p-6 space-y-5">
        {/* KPI 4열 */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard label="STON-S 단위재료비" value={fmtRate(avgMatRate('STON-S'))} sub="평균 재료비율" />
          <KpiCard label="STON+(카트) 단위재료비" value={fmtRate(avgMatRate('STON-CART'))} sub="평균 재료비율" />
          <KpiCard label="STON+ 단위재료비" value={fmtRate(avgMatRate('STON-PLUS'))} sub="평균 재료비율" />
          <KpiCard label="BOM 자재 총수" value={`${summary.reduce((s, r) => s + r.bom_item_count, 0)}종`} sub="등록 BOM 항목" />
        </div>

        {/* BOM 목록 */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700">완제품별 단위 재료비</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['자재코드', '제품명', '제품군', '표준단가', '단위재료비', '재료비율', 'BOM 항목수', ''].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs text-slate-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summary.map((s) => (
                  <tr key={s.matnr} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-blue-700 font-medium">{s.matnr}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-800 font-medium">{s.product_name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        s.model_group === 'STON-S' ? 'bg-blue-100 text-blue-700' :
                        s.model_group === 'STON-CART' ? 'bg-violet-100 text-violet-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {s.model_group.replace('STON-CART', 'STON+(카트)').replace('STON-PLUS', 'STON+')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{s.std_price.toLocaleString('ko-KR')}원</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">{s.unit_material_cost.toLocaleString('ko-KR')}원</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${s.material_rate > 55 ? 'bg-red-400' : s.material_rate > 45 ? 'bg-yellow-400' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min(s.material_rate, 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-semibold w-12 text-right ${s.material_rate > 55 ? 'text-red-600' : 'text-slate-700'}`}>
                          {fmtRate(s.material_rate)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{s.bom_item_count}종</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/bom/${s.matnr}`}
                        className="text-xs text-blue-600 hover:underline font-medium"
                      >
                        상세 →
                      </Link>
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
