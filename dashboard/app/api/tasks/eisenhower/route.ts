/**
 * Tasks API - Eisenhower Matrix
 *
 * GET /api/tasks/eisenhower - Get tasks grouped by Eisenhower quadrant
 */

import { NextResponse } from 'next/server'
import { getEisenhowerMatrix, tasksFileExists } from '@/lib/task-parser'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Check if tasks file exists
    if (!tasksFileExists()) {
      return NextResponse.json(
        { error: 'Tasks file not found' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)

    // includeCompleted - boolean
    const includeCompleted = searchParams.get('includeCompleted') === 'true'

    const matrix = await getEisenhowerMatrix(includeCompleted)

    return NextResponse.json({
      matrix,
      counts: {
        Q1: matrix.Q1.length,
        Q2: matrix.Q2.length,
        Q3: matrix.Q3.length,
        Q4: matrix.Q4.length,
        total: matrix.Q1.length + matrix.Q2.length + matrix.Q3.length + matrix.Q4.length
      },
      labels: {
        Q1: 'Do First (Urgent + Important)',
        Q2: 'Schedule (Important)',
        Q3: 'Delegate (Urgent)',
        Q4: 'Consider Dropping (Neither)'
      }
    })
  } catch (error) {
    console.error('Error fetching Eisenhower matrix:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Eisenhower matrix' },
      { status: 500 }
    )
  }
}
