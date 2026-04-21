'use client'

import { useState, useEffect } from 'react'
import { useQueryState, parseAsInteger, parseAsString } from 'nuqs'
import Header from '@/components/layout/Header'
import KpiCard from '@/components/common/KpiCard'
import StockTable from '@/components/inventory/StockTable'
import ExportButton from '@/components/common/ExportButton'
import { fmtKRW } from '@/lib/utils/format'
import type { MaterialType, StockItem, StockSummary } from '@/types'

const TABS: { key: MaterialType; label: string }[] = [
  { key: 'FERT', label: 'FERT (완제품)' },
  { key: 'HALB', label: 'HALB (재공품)' },
  { key: 'ROH', label: 'ROH (자재)' },
]

export default function InventoryContent() {
  const [year] = useQueryState('year', parseAsInteger.withDefault(2025))
  const [period] = useQueryState('period', parseAsInteger.withDefault(12))
  const [model] = useQueryState('model', parseAsString.withDefault('all'))
  const [activeTab, setActiveTab] = useState<MaterialType>('FERT')
  const [items, setItems] = useState<StockItem[]>([])
  const [summary, setSummary] = useState<StockSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ year: String(year), period: String(period), model, type: activeTab })
    fetch(`/api/inventory?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setItems(data)
        setLoading(false)
      })
  }, [year, period, model, activeTab])

  useEffect(() => {
    const allParams = new URLSearchParams({ year: String(year), period: String(period), model })
    Promise.all([
      fetch(`/api/inventory?${allParams}&type=FERT`).then((r) => r.json()),
      fetch(`/api/inventory?${allParams}&type=HALB`).then((r) => r.json()),
      fetch(`/api/inventory?${allParams}&type=ROH`).then((r) => r.json()),
    ]).then(([fert, halb, roh]) => {
      setSummary({
        fert_closing_qty: fert.reduce((s: number, r: StockItem) => s + r.closing_qty, 0),
        fert_closing_amt: fert.reduce((s: number, r: StockItem) => s + r.closing_amt, 0),
        fert_avg_price: Math.round(
          fert.reduce((s: number, r: StockItem) => s + r.closing_amt, 0) /
          Math.max(1, fert.reduce((s: number, r: StockItem) => s + r.closing_qty, 0))
        ),
        halb_closing_qty: halb.reduce((s: number, r: StockItem) => s + r.closing_qty, 0),
        halb_closing_amt: halb.reduce((s: number, r: StockItem) => s + r.closing_amt, 0),
        roh_closing_qty: roh.reduce((s: number, r: StockItem) => s + r.closing_qty, 0),
        roh_closing_amt: roh.reduce((s: number, r: StockItem) => s + r.closing_amt, 0),
        po_receipt_amt: roh.reduce((s: number, r: StockItem) => s + r.receipt_amt, 0),
      })
    })
  }, [year, period, model])

  const exportData = items.map((r) => ({
    자재코드: r.matnr,
    자재명: r.product_name,
    유형: r.material_type,
    기초수량: r.opening_qty,
    기초금액: r.opening_amt,
    입고수량: r.receipt_qty,
    입고금액: r.receipt_amt,
    출고수량: r.issue_qty,
    출고금액: r.issue_amt,
    기말수량: r.closing_qty,
    기말금액: r.closing_amt,
    평균단가: r.avg_price,
  }))

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header />

      <div className="p-6 space-y-5">
        {summary && (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard
              label="완제품 기말재고"
              value={fmtKRW(summary.fert_closing_amt)}
              sub={`${summary.fert_closing_qty.toLocaleString('ko-KR')} EA · 평균 ${summary.fert_avg_price.toLocaleString('ko-KR')}원/EA`}
            />
            <KpiCard
              label="재공품 기말재고"
              value={fmtKRW(summary.halb_closing_amt)}
              sub={`${summary.halb_closing_qty.toLocaleString('ko-KR')} EA`}
            />
            <KpiCard
              label="자재 기말재고"
              value={fmtKRW(summary.roh_closing_amt)}
              sub={`${summary.roh_closing_qty.toLocaleString('ko-KR')}개`}
            />
            <KpiCard
              label="구매입고 (누계)"
              value={fmtKRW(summary.po_receipt_amt)}
              sub="해당 기간 구매입고 합산"
            />
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4">
            <div className="flex">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-[#d85a30] text-[#d85a30]'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <ExportButton data={exportData} filename={`수불부_${activeTab}`} />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
              데이터 로딩 중...
            </div>
          ) : (
            <StockTable items={items} type={activeTab} />
          )}
        </div>
      </div>
    </div>
  )
}
