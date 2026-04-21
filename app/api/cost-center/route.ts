import { NextRequest, NextResponse } from 'next/server'
import { sapConnector } from '@/lib/sap-connector'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const fiscal_year = Number(searchParams.get('fiscal_year') ?? new Date().getFullYear())
  const fiscal_period = searchParams.get('fiscal_period') ? Number(searchParams.get('fiscal_period')) : undefined
  const profit_center_id = searchParams.get('profit_center_id') ?? undefined
  const cost_center_id = searchParams.get('cost_center_id') ?? undefined

  try {
    const data = await sapConnector.getCostCenterActuals({ fiscal_year, fiscal_period, profit_center_id, cost_center_id })
    return NextResponse.json(data)
  } catch (error) {
    console.error('cost-center API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
