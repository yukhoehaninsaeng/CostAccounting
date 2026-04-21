import { NextRequest, NextResponse } from 'next/server'
import { sapConnector } from '@/lib/sap-connector'

export async function GET() {
  try {
    const [rfcs, logs] = await Promise.all([
      sapConnector.getRfcStatus(),
      sapConnector.getSyncLogs(),
    ])
    return NextResponse.json({ rfcs, logs, last_sync: '2025-12-31 23:58' })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  try {
    const result = await sapConnector.triggerSync(body.rfc_name)
    return NextResponse.json(result)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
