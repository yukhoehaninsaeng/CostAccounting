import { sapConnector } from '@/lib/sap-connector'
import Header from '@/components/layout/Header'
import BomTree from '@/components/bom/BomTree'
import KpiCard from '@/components/common/KpiCard'
import { fmtRate } from '@/lib/utils/format'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function BomDetailPage({
  params,
  searchParams,
}: {
  params: { matnr: string }
  searchParams: { plant?: string }
}) {
  const plant = searchParams.plant ?? '4000'
  const matnr = params.matnr

  const [nodes, summaries] = await Promise.all([
    sapConnector.getBom({ plant, matnr, levels: 'all' }),
    sapConnector.getBomSummary(plant),
  ])

  const summary = summaries.find((s) => s.matnr === matnr)
  if (!summary) notFound()

  const rohNodes = nodes.filter((n) => n.child_type === 'ROH')
  const halbNodes = nodes.filter((n) => n.child_type === 'HALB')
  const rohCost = rohNodes.reduce((s, n) => s + n.level_cost, 0)
  const halbCost = halbNodes.reduce((s, n) => s + n.level_cost, 0)

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header />

      <div className="p-6 space-y-5">
        {/* 뒤로가기 + 제목 */}
        <div className="flex items-center gap-3">
          <Link href="/bom" className="flex items-center gap-1 text-slate-400 hover:text-slate-600 text-sm">
            <ArrowLeft size={15} /> BOM 목록
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-mono text-sm font-bold text-slate-800">{matnr}</span>
          <span className="text-slate-600 text-sm">{summary.product_name}</span>
        </div>

        {/* KPI 카드 */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            label="표준단가"
            value={`${summary.std_price.toLocaleString('ko-KR')}원`}
            sub="SAP 표준원가"
          />
          <KpiCard
            label="단위 재료비"
            value={`${summary.unit_material_cost.toLocaleString('ko-KR')}원`}
            sub="BOM 기준 합산"
          />
          <KpiCard
            label="재료비율"
            value={fmtRate(summary.material_rate)}
            sub="단위재료비 / 표준단가"
            delta={summary.material_rate - 45}
            deltaType="rate"
            isInverse
          />
          <KpiCard
            label="BOM 항목수"
            value={`${summary.bom_item_count}종`}
            sub={`ROH ${rohNodes.length}종 · HALB ${halbNodes.length}종`}
          />
        </div>

        {/* 원가 구성 */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'ROH 재료비', cost: rohCost, count: rohNodes.length, color: 'bg-orange-100 border-orange-200' },
            { label: 'HALB 반제품', cost: halbCost, count: halbNodes.length, color: 'bg-green-100 border-green-200' },
            { label: '합계', cost: summary.unit_material_cost, count: summary.bom_item_count, color: 'bg-blue-100 border-blue-200' },
          ].map((item) => (
            <div key={item.label} className={`rounded-xl border p-4 ${item.color}`}>
              <p className="text-xs font-medium text-slate-600">{item.label}</p>
              <p className="text-lg font-bold text-slate-800 mt-1">{item.cost.toLocaleString('ko-KR')}원</p>
              <p className="text-xs text-slate-500 mt-0.5">{item.count}종</p>
            </div>
          ))}
        </div>

        {/* BOM 트리 */}
        <BomTree
          nodes={nodes}
          rootMatnr={matnr}
          rootName={summary.product_name}
          stdPrice={summary.std_price}
          matRate={summary.material_rate}
        />
      </div>
    </div>
  )
}
