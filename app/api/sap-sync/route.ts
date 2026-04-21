import { NextResponse } from 'next/server'
import { sapConnector } from '@/lib/sap-connector'

export async function POST() {
  try {
    const result = await sapConnector.triggerSync()
    return NextResponse.json(result)
  } catch (error) {
    console.error('sap-sync API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
