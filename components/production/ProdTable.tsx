'use client'

import DataTable, { Column } from '@/components/common/DataTable'
import DeltaBadge from '@/components/common/DeltaBadge'
import { fmtKRW, fmtKRWFull, fmtRate } from '@/lib/utils/format'
import type { ProductionItem } from '@/types'

interface Props {
  items: ProductionItem[]
}

const MODEL_BADGE: Record<string, string> = {
  'STON-S': 'bg-blue-100 text-blue-700',
  'STON-CART': 'bg-violet-100 text-violet-700',
  'STON-PLUS': 'bg-emerald-100 text-emerald-700',
}

export default function ProdTable({ items }: Props) {
  const totActQty = items.reduce((s, r) => s + r.actual_qty, 0)
  const totActAmt = items.reduce((s, r) => s + r.actual_amount, 0)
  const totActMat = items.reduce((s, r) => s + r.actual_mat_cost, 0)
  const totPlanQty = items.reduce((s, r) => s + r.plan_qty, 0)
  const totPlanAmt = items.reduce((s, r) => s + r.plan_amount, 0)
  const totQtyVar = totActQty - totPlanQty
  const totAmtVar = totActAmt - totPlanAmt

  const columns: Column<ProductionItem>[] = [
    {
      key: 'matnr',
      header: '자재코드',
      sortable: true,
      render: (v) => <span className="font-mono text-xs text-blue-700 font-medium">{String(v)}</span>,
    },
    {
      key: 'product_name',
      header: '제품명',
      sortable: true,
      render: (v) => <span className="text-slate-800 font-medium">{String(v)}</span>,
    },
    {
      key: 'model_group',
      header: '제품군',
      align: 'center',
      render: (v) => (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${MODEL_BADGE[String(v)] ?? 'bg-slate-100 text-slate-600'}`}>
          {String(v).replace('STON-CART', 'STON+(카트)').replace('STON-PLUS', 'STON+')}
        </span>
      ),
    },
    // ── 실적 그룹
    {
      key: 'actual_qty',
      header: '수량(EA)',
      headerGroup: '실적',
      align: 'right',
      sortable: true,
      render: (v) => <span className="text-[#0c1e3c] font-medium">{Number(v).toLocaleString('ko-KR')}</span>,
      footerValue: <span className="text-[#0c1e3c] font-bold">{totActQty.toLocaleString('ko-KR')}</span>,
    },
    {
      key: 'actual_amount',
      header: '금액',
      headerGroup: '실적',
      align: 'right',
      sortable: true,
      render: (v) => (
        <span className="text-[#0c1e3c] font-medium" title={fmtKRWFull(Number(v))}>{fmtKRW(Number(v))}</span>
      ),
      footerValue: <span className="text-[#0c1e3c] font-bold">{fmtKRW(totActAmt)}</span>,
    },
    {
      key: 'actual_mat_cost',
      header: '재료비',
      headerGroup: '실적',
      align: 'right',
      sortable: true,
      render: (v) => (
        <span className="text-[#0c1e3c]" title={fmtKRWFull(Number(v))}>{fmtKRW(Number(v))}</span>
      ),
      footerValue: <span className="text-[#0c1e3c]">{fmtKRW(totActMat)}</span>,
    },
    {
      key: 'actual_mat_rate',
      header: '재료비율',
      headerGroup: '실적',
      align: 'right',
      sortable: true,
      render: (v) => <span className="text-[#0c1e3c]">{fmtRate(Number(v))}</span>,
      footerValue: <span className="text-[#0c1e3c]">{fmtRate((totActMat / totActAmt) * 100)}</span>,
    },
    // ── 편성 그룹
    {
      key: 'plan_qty',
      header: '수량(EA)',
      headerGroup: '편성',
      align: 'right',
      sortable: true,
      render: (v) => <span className="text-slate-500">{Number(v).toLocaleString('ko-KR')}</span>,
      footerValue: <span className="text-slate-600">{totPlanQty.toLocaleString('ko-KR')}</span>,
    },
    {
      key: 'plan_amount',
      header: '금액',
      headerGroup: '편성',
      align: 'right',
      sortable: true,
      render: (v) => (
        <span className="text-slate-500" title={fmtKRWFull(Number(v))}>{fmtKRW(Number(v))}</span>
      ),
      footerValue: <span className="text-slate-600">{fmtKRW(totPlanAmt)}</span>,
    },
    {
      key: 'plan_mat_rate',
      header: '재료비율',
      headerGroup: '편성',
      align: 'right',
      sortable: true,
      render: (v) => <span className="text-slate-500">{fmtRate(Number(v))}</span>,
    },
    // ── 차이 그룹
    {
      key: 'qty_variance',
      header: '수량차이',
      headerGroup: '차이',
      align: 'right',
      sortable: true,
      render: (v) => <DeltaBadge value={Number(v)} type="qty" />,
      footerValue: <DeltaBadge value={totQtyVar} type="qty" />,
    },
    {
      key: 'amt_variance',
      header: '금액차이',
      headerGroup: '차이',
      align: 'right',
      sortable: true,
      render: (v) => <DeltaBadge value={Number(v)} type="amount" />,
      footerValue: <DeltaBadge value={totAmtVar} type="amount" />,
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={items}
      searchable
      searchKeys={['matnr', 'product_name']}
      pageSize={50}
    />
  )
}
