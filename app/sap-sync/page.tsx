import { sapConnector } from '@/lib/sap-connector'
import Header from '@/components/layout/Header'
import { fmtKRW } from '@/lib/utils/format'
import { CheckCircle2, XCircle, Loader2, Clock, RefreshCw, Database } from 'lucide-react'
import type { SyncStatus } from '@/types'

export const dynamic = 'force-dynamic'

const statusConfig: Record<SyncStatus, { icon: React.ReactNode; cls: string; label: string }> = {
  SUCCESS: {
    icon: <CheckCircle2 size={14} />,
    cls: 'text-green-700 bg-green-50 border-green-200',
    label: '성공',
  },
  FAILED: {
    icon: <XCircle size={14} />,
    cls: 'text-red-700 bg-red-50 border-red-200',
    label: '실패',
  },
  RUNNING: {
    icon: <Loader2 size={14} className="animate-spin" />,
    cls: 'text-blue-700 bg-blue-50 border-blue-200',
    label: '실행중',
  },
  PENDING: {
    icon: <Clock size={14} />,
    cls: 'text-slate-600 bg-slate-50 border-slate-200',
    label: '대기',
  },
}

function StatusPill({ status }: { status: SyncStatus }) {
  const cfg = statusConfig[status]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.cls}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  )
}

function formatDuration(started: string, finished: string | null): string {
  if (!finished) return '—'
  const diff = new Date(finished).getTime() - new Date(started).getTime()
  const s = Math.round(diff / 1000)
  return s < 60 ? `${s}초` : `${Math.floor(s / 60)}분 ${s % 60}초`
}

export default async function SapSyncPage() {
  const [rfcList, logs] = await Promise.all([
    sapConnector.getRfcStatus(),
    sapConnector.getSyncLogs(),
  ])

  const successCount = rfcList.filter((r) => r.status === 'SUCCESS').length
  const totalSynced = rfcList.reduce((s, r) => s + r.last_count, 0)

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header />

      <div className="p-6 space-y-5">
        {/* 상태 요약 */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: 'RFC 연결', value: `${successCount} / ${rfcList.length}`, sub: '활성 연결', ok: successCount === rfcList.length },
            { label: '마지막 동기화', value: '2025-12-31', sub: '23:50 완료', ok: true },
            { label: '동기화 건수', value: `${totalSynced.toLocaleString('ko-KR')}건`, sub: '최근 실행 합산', ok: true },
            { label: '데이터 소스', value: 'MOCK 모드', sub: 'SAP 연결 대기중', ok: false },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-xs text-slate-500 font-medium">{card.label}</p>
              <p className={`text-xl font-bold mt-1 ${card.ok ? 'text-slate-800' : 'text-amber-600'}`}>{card.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* RFC 현황 테이블 */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Database size={16} className="text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-700">RFC 함수 연동 현황</h3>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#0c1e3c] hover:bg-[#1a3258] rounded-lg transition-colors">
              <RefreshCw size={12} />
              전체 동기화
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['RFC 함수명', 'SAP T-Code', '설명', '실행 주기', '최종 실행', '건수', '상태', ''].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs text-slate-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rfcList.map((rfc) => (
                  <tr key={rfc.rfc_name} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-[#0c1e3c]">{rfc.rfc_name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-slate-500">{rfc.transaction}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{rfc.description}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{rfc.schedule}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{rfc.last_run}</td>
                    <td className="px-4 py-3 text-right text-slate-700 font-medium">
                      {rfc.last_count.toLocaleString('ko-KR')}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={rfc.status} />
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-xs text-blue-600 hover:underline font-medium whitespace-nowrap">
                        실행 →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 동기화 이력 */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Clock size={16} className="text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-700">동기화 이력</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['RFC', '시작 시각', '완료 시각', '소요시간', '동기화 건수', '결과'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs text-slate-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-[#0c1e3c]">{log.rfc_name}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {new Date(log.started_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {log.finished_at ? new Date(log.finished_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {formatDuration(log.started_at, log.finished_at)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">
                      {log.synced_count.toLocaleString('ko-KR')}건
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={log.status} />
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
