'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import StatusBadge from '@/components/common/StatusBadge'
import { fmtKRW, fmtKRWFull } from '@/lib/utils/format'
import type { StockItem, MaterialType } from '@/types'
import { ArrowLeft } from 'lucide-react'

export default function InventoryDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const type = String(params.type).toUpperCase() as MaterialType
  const matnr = searchParams.get('matnr')
  const year = searchParams.get('year') ?? '2025'
  const period = searchParams.get('period') ?? '12'

  const [item, setItem] = useState<StockItem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!matnr) return
    const q = new URLSearchParams({ year, period, type, matnr })
    fetch(`/api/inventory?${q}`)
      .then((r) => r.json())
      .then((data: StockItem[]) => {
        setItem(data[0] ?? null)
        setLoading(false)
      })
  }, [matnr, year, period, type])

  if (!matnr) {
    return (
      <div className="flex flex-col flex-1">
        <Header />
        <div className="p-6 text-slate-500">
          자재코드가 필요합니다. <Link href="/inventory" className="text-blue-600 hover:underline">수불부 목록으로</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header />
      <div className="p-6 space-y-5">
        {/* 헤더 */}
        <div className="flex items-center gap-3">
          <Link href="/inventory" className="flex items-center gap-1 text-slate-400 hover:text-slate-600 text-sm">
            <ArrowLeft size={15} /> 수불부 목록
          </Link>
          <span className="text-slate-300">/</span>
          <div className="flex items-center gap-2">
            <StatusBadge type={type} />
            <span className="font-mono text-sm font-bold text-slate-800">{matnr}</span>
            {item && <span className="text-slate-600">{item.product_name}</span>}
          </div>
        </div>

        {loading ? (
          <div className="text-slate-400 text-sm py-8 text-center">로딩 중...</div>
        ) : item ? (
          <>
            {/* 기본 정보 카드 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: '기말재고 수량', value: `${item.closing_qty.toLocaleString('ko-KR')} EA` },
                { label: '기말재고 금액', value: fmtKRW(item.closing_amt), sub: fmtKRWFull(item.closing_amt) },
                { label: '평균단가', value: `${item.avg_price.toLocaleString('ko-KR')}원/EA` },
                { label: '표준단가', value: item.std_price ? `${item.std_price.toLocaleString('ko-KR')}원/EA` : '—' },
              ].map((card) => (
                <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-5">
                  <p className="text-xs text-slate-500 font-medium">{card.label}</p>
                  <p className="text-xl font-bold text-slate-800 mt-1">{card.value}</p>
                  {card.sub && <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>}
                </div>
              ))}
            </div>

            {/* 이동 내역 */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-700">이동 내역 ({year}년 {period}월)</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['구분', '수량 (EA)', '금액', '비고'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs text-slate-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: '기초재고', qty: item.opening_qty, amt: item.opening_amt, note: '전월 이월' },
                    { label: '입 고', qty: item.receipt_qty, amt: item.receipt_amt, note: type === 'ROH' ? '구매입고' : '생산입고' },
                    { label: '출 고', qty: item.issue_qty, amt: item.issue_amt, note: type === 'FERT' ? '판매출고' : '생산출고' },
                    { label: '기말재고', qty: item.closing_qty, amt: item.closing_amt, note: '당월 마감' },
                  ].map((row) => (
                    <tr key={row.label} className="border-b border-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-700">{row.label}</td>
                      <td className="px-5 py-3 text-right text-slate-800">{row.qty.toLocaleString('ko-KR')}</td>
                      <td className="px-5 py-3 text-right text-slate-800" title={fmtKRWFull(row.amt)}>{fmtKRW(row.amt)}</td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* BOM 링크 (FERT만) */}
            {type === 'FERT' && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">BOM 원가 분석</p>
                  <p className="text-xs text-blue-600 mt-0.5">이 완제품의 BOM 구조와 단위 재료비를 확인합니다</p>
                </div>
                <Link
                  href={`/bom/${matnr}`}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  BOM 보기 →
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="text-slate-400 text-sm py-8 text-center">해당 자재 데이터를 찾을 수 없습니다.</div>
        )}
      </div>
    </div>
  )
}
