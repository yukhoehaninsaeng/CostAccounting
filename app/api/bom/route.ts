import { NextRequest, NextResponse } from 'next/server'
import { sapConnector } from '@/lib/sap-connector'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const matnr = searchParams.get('matnr')
  const plant = searchParams.get('plant') ?? '4000'
  const levels = (searchParams.get('levels') ?? 'all') as '1' | '2' | 'all'

  try {
    if (matnr) {
      const nodes = await sapConnector.getBom({ plant, matnr, levels })
      return NextResponse.json(nodes)
    }
    const summary = await sapConnector.getBomSummary(plant)
    return NextResponse.json(summary)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
