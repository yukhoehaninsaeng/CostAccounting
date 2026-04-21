import { NextRequest, NextResponse } from 'next/server'
import { sapConnector } from '@/lib/sap-connector'
import type { MaterialType } from '@/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = (searchParams.get('type') ?? 'FERT').toUpperCase() as MaterialType
  const params = {
    year: Number(searchParams.get('year') ?? 2025),
    period: Number(searchParams.get('period') ?? 12),
    model: searchParams.get('model') ?? 'all',
    plant: searchParams.get('plant') ?? '4000',
    type,
    matnr: searchParams.get('matnr') ?? undefined,
  }
  try {
    const data = await sapConnector.getInventory(params)
    return NextResponse.json(data)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
