import { NextRequest, NextResponse } from 'next/server'
import { sapConnector } from '@/lib/sap-connector'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const params = {
    year: Number(searchParams.get('year') ?? 2025),
    period: Number(searchParams.get('period') ?? 12),
    model: searchParams.get('model') ?? 'all',
    plant: searchParams.get('plant') ?? '4000',
  }
  try {
    const [kpi, chartData, composition, topProducts] = await Promise.all([
      sapConnector.getDashboardKpi(params),
      sapConnector.getDashboardChartData(params),
      sapConnector.getInventoryComposition(params),
      sapConnector.getProduction(params).then((items) =>
        items.sort((a, b) => b.actual_amount - a.actual_amount).slice(0, 8)
      ),
    ])
    return NextResponse.json({ kpi, chartData, composition, topProducts })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
