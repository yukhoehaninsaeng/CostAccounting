'use client'

import { useRouter } from 'next/navigation'
import DataTable, { Column } from '@/components/common/DataTable'
import StatusBadge from '@/components/common/StatusBadge'
import { fmtKRW, fmtKRWFull, fmtQty } from '@/lib/utils/format'
import type { StockItem, MaterialType } from '@/types'

interface Props {
  items: StockItem[]
  type: MaterialType
}

export default function StockTable({ items, type }: Props) {
  const router = useRouter()

  const isROH = type === 'ROH'

  const columns: Column<StockItem>[] = [
    {
      key: 'matnr',
      header: '자재코드',
      sortable: true,
      render: (v) => (
        <span className="font-mono text-xs text-blue-700 font-medium">{String(v)}</span>
      ),
    },
    {
      key: 'product_name',
      header: '자재명',
      sortable: true,
      render: (v) => <span className="text-slate-800 font-medium">{String(v)}</span>,
    },
    {
      key: 'material_type',
      header: '유형',
      align: 'center',
      render: (v) => <StatusBadge type={String(v) as MaterialType} />,
    },
    {
      key: 'opening_qty',
      header: '기초수량',
      align: 'right',
      sortable: true,
      render: (v) => <span className="text-slate-600">{Number(v).toLocaleString('ko-KR')}</span>,
    },
    {
      key: 'opening_amt',
      header: '기초금액',
      align: 'right',
      sortable: true,
      render: (v) => (
        <span className="text-slate-600" title={fmtKRWFull(Number(v))}>{fmtKRW(Number(v))}</span>
      ),
    },
    ...(isROH ? [{
      key: 'gr_po_qty' as keyof StockItem,
      header: '구매입고',
      align: 'right' as const,
      sortable: true,
      render: (v: unknown) => <span className="text-slate-600">{Number(v ?? 0).toLocaleString('ko-KR')}</span>,
    }] : []),
    {
      key: 'receipt_qty',
      header: isROH ? '총입고' : '생산입고',
      align: 'right',
      sortable: true,
      render: (v) => <span className="text-blue-700 font-medium">{Number(v).toLocaleString('ko-KR')}</span>,
    },
    {
      key: 'receipt_amt',
      header: '입고금액',
      align: 'right',
      sortable: true,
      render: (v) => (
        <span className="text-blue-700" title={fmtKRWFull(Number(v))}>{fmtKRW(Number(v))}</span>
      ),
    },
    {
      key: 'issue_qty',
      header: isROH ? '생산출고' : '판매출고',
      align: 'right',
      sortable: true,
      render: (v) => <span className="text-slate-600">{Number(v).toLocaleString('ko-KR')}</span>,
    },
    {
      key: 'issue_amt',
      header: '출고금액',
      align: 'right',
      sortable: true,
      render: (v) => (
        <span className="text-slate-600" title={fmtKRWFull(Number(v))}>{fmtKRW(Number(v))}</span>
      ),
    },
    {
      key: 'closing_qty',
      header: '기말수량',
      align: 'right',
      sortable: true,
      render: (v) => (
        <span className={Number(v) === 0 ? 'text-slate-300' : 'text-blue-700 font-semibold'}>
          {Number(v).toLocaleString('ko-KR')}
        </span>
      ),
      footerValue: items.reduce((s, r) => s + r.closing_qty, 0).toLocaleString('ko-KR'),
    },
    {
      key: 'closing_amt',
      header: '기말금액',
      align: 'right',
      sortable: true,
      render: (v) => (
        <span className="font-semibold text-slate-800" title={fmtKRWFull(Number(v))}>{fmtKRW(Number(v))}</span>
      ),
      footerValue: fmtKRW(items.reduce((s, r) => s + r.closing_amt, 0)),
    },
    {
      key: 'avg_price',
      header: '평균단가',
      align: 'right',
      sortable: true,
      render: (v) => <span className="text-slate-600">{Number(v).toLocaleString('ko-KR')}원</span>,
    },
  ]

  function handleRowClick(row: StockItem) {
    router.push(`/inventory/${type.toLowerCase()}?matnr=${row.matnr}`)
  }

  return (
    <DataTable
      columns={columns}
      data={items}
      searchable
      searchKeys={['matnr', 'product_name']}
      pageSize={50}
      onRowClick={handleRowClick}
    />
  )
}
