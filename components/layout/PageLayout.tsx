interface PageLayoutProps {
  children: React.ReactNode
}

export default function PageLayout({ children }: PageLayoutProps) {
  return (
    <main className="flex-1 overflow-auto bg-slate-50">
      {children}
    </main>
  )
}
