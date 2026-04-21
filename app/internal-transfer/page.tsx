import { sapConnector } from '@/lib/sap-connector'
import { formatCurrency, formatNumber } from '@/lib/utils'
import StatusBadge from '@/components/common/StatusBadge'

export const dynamic = 'force-dynamic'

export default async function InternalTransferPage({
  searchParams,
}: {
  searchParams: { fiscal_year?: string; fiscal_period?: string; status?: string }
}) {
  const fiscal_year = Number(searchParams.fiscal_year ?? 2025)
  const fiscal_period = searchParams.fiscal_period ? Number(searchParams.fiscal_period) : undefined
  const statusFilter = searchParams.status || undefined

  let transfers = await sapConnector.getInternalTransfers({ fiscal_year, fiscal_period })

  if (statusFilter) {
    transfers = transfers.filter((t) => t.status === statusFilter)
  }

  const totalAmount = transfers.reduce((s, t) => s + t.transfer_amount, 0)
  const confirmedAmount = transfers.filter((t) => t.status === 'CONFIRMED').reduce((s, t) => s + t.transfer_amount, 0)

  return (
    <div className="flex flex-col flex-1">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">내부대체가액</h2>
          <p className="text-sm text-slate-500 mt-0.5">CO-OM-CEL 기반 원가센터 간 내부대체 현황</p>
        </div>
      </header>

      <form className="flex flex-wrap items-center gap-3 px-6 py-3 bg-white border-b border-slate-100">
        <select name="fiscal_year" defaultValue={fiscal_year}
          className="text-sm border border-slate-200 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}년</option>)}
        </select>
        <select name="fiscal_period" defaultValue={fiscal_period ?? ''}
          className="text-sm border border-slate-200 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">전체</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((p) => <option key={p} value={p}>{p}월</option>)}
        </select>
        <select name="status" defaultValue={statusFilter ?? ''}
          className="text-sm border border-slate-200 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">전체 상태</option>
          <option value="DRAFT">초안</option>
          <option value="CONFIRMED">확정</option>
          <option value="REVERSED">역분개</option>
        </select>
        <button type="submit"
          className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          조회
        </button>
      </form>

      <div className="flex-1 p-6 space-y-4">
        {/* 요약 카드 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">총 대체 건수</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{transfers.length}건</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">총 대체 금액</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalAmount)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">확정 금액</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{formatCurrency(confirmedAmount)}</p>
          </div>
        </div>

        {/* 테이블 */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">기간</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">제공 원가센터</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">수혜처</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">서비스 유형</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">수량</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">단가</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">대체금액</th>
                  <th className="text-center px-4 py-3 text-slate-500 font-medium">상태</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((t) => (
                  <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{t.fiscal_year}년 {t.fiscal_period}월</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{t.sender_cost_center.cost_center_name}</div>
                      <div className="text-xs text-slate-400">{t.sender_cost_center.cost_center_code}</div>
                    </td>
                    <td className="px-4 py-3">
                      {t.receiver_cost_center && (
                        <div>
                          <div className="font-medium text-slate-700">{t.receiver_cost_center.cost_center_name}</div>
                          <div className="text-xs text-slate-400">원가센터</div>
                        </div>
                      )}
                      {t.receiver_project && (
                        <div>
                          <div className="font-medium text-slate-700">{t.receiver_project.project_name}</div>
                          <div className="text-xs text-slate-400">프로젝트</div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{t.service_type}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatNumber(t.quantity)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(t.unit_price)}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">{formatCurrency(t.transfer_amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={t.status} />
                    </td>
                  </tr>
                ))}
                {transfers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">조회된 데이터가 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
