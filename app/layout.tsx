import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import './globals.css'
import Sidebar from '@/components/layout/Sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BJC E-Health 원가관리',
  description: 'SAP RFC 기반 원가 집계 및 분석 시스템',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <NuqsAdapter>
          <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {children}
            </div>
          </div>
        </NuqsAdapter>
      </body>
    </html>
  )
}
