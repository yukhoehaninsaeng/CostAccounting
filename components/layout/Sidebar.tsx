'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, Factory, GitBranch, Radio } from 'lucide-react'
import { cn } from '@/lib/utils/format'

const navItems = [
  { href: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/inventory', label: '수불부', icon: Package },
  { href: '/production', label: '생산금액 산출', icon: Factory },
  { href: '/bom', label: 'BOM 원가', icon: GitBranch },
  { href: '/sap-sync', label: 'SAP 연동 현황', icon: Radio },
]

const LAST_SYNC = '2025-12-31 23:58'

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 min-h-screen bg-[#0c1e3c] text-white flex flex-col flex-shrink-0">
      {/* 로고 */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="bg-[#d85a30] text-white text-xs font-bold px-2 py-0.5 rounded">BJC</span>
          <div>
            <p className="text-sm font-bold leading-tight">E-Health</p>
            <p className="text-xs text-slate-400 leading-tight">원가관리 시스템</p>
          </div>
        </div>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 py-4">
        <ul className="space-y-0.5 px-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors relative',
                    active
                      ? 'bg-[#1a3258] text-white border-l-[3px] border-[#d85a30] pl-[calc(0.75rem-3px)]'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Icon size={16} className="flex-shrink-0" />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* SAP 동기화 정보 */}
      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">마지막 SAP 동기화</p>
        <p className="text-xs text-slate-400 font-mono">{LAST_SYNC}</p>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
          <span className="text-[10px] text-orange-400">Mock 데이터 모드</span>
        </div>
      </div>
    </aside>
  )
}
