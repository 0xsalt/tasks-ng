/**
 * Sprint API Route
 *
 * GET /api/sprint - Get sprint summary data
 */

import { NextResponse } from 'next/server'
import { generateSprintSummary } from '@/lib/sprint-generator'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const summary = await generateSprintSummary()
    return NextResponse.json(summary)
  } catch (error) {
    console.error('Failed to generate sprint summary:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate sprint' },
      { status: 500 }
    )
  }
}
