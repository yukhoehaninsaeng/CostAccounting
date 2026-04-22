import { NextRequest, NextResponse } from 'next/server'
import { sapConnector } from '@/lib/sap-connector'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const params = {
    year: Number(searchParams.get('year') ?? 2025),
    period: Number(searchParams.get('period') ?? 12),
    model: searchParams.get('model') ?? 'all',
    plant: searchParams.get('plant') ?? '4000',
    matnr: searchParams.get('matnr') ?? undefined,
  }
  try {
    const [items, summary] = await Promise.all([
      sapConnector.getProduction(params),
      sapConnector.getProductionSummary(params),
    ])
    return NextResponse.json({ items, summary })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
