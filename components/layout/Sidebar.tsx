'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', label: '대시보드', icon: '📊' },
  { href: '/cost-center', label: '원가센터 집계', icon: '🏢' },
  { href: '/project', label: '프로젝트 원가', icon: '📁' },
  { href: '/internal-transfer', label: '내부대체가액', icon: '🔄' },
  { href: '/standard-cost', label: '표준원가 배분', icon: '⚖️' },
  { href: '/profitability', label: '수익성 분석', icon: '📈' },
  { href: '/profit-center', label: '이익센터 손익', icon: '💰' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-lg font-bold leading-tight">원가/관리회계</h1>
        <p className="text-xs text-slate-400 mt-1">SAP CO 기반 분석 시스템</p>
      </div>

      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
          Mock 데이터 모드
        </div>
      </div>
    </aside>
  )
}
