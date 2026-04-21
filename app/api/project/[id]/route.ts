import { NextRequest, NextResponse } from 'next/server'
import { sapConnector } from '@/lib/sap-connector'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(request.url)
  const fiscal_year = Number(searchParams.get('fiscal_year') ?? new Date().getFullYear())
  const fiscal_period = searchParams.get('fiscal_period') ? Number(searchParams.get('fiscal_period')) : undefined

  try {
    const data = await sapConnector.getProjectActuals({
      fiscal_year,
      fiscal_period,
      project_id: params.id,
    })
    return NextResponse.json(data)
  } catch (error) {
    console.error('project detail API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
