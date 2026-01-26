/**
 * Tasks API - Sections
 *
 * GET /api/tasks/sections - Get all available sections
 */

import { NextResponse } from 'next/server'
import { getSections, tasksFileExists } from '@/lib/task-parser'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Check if tasks file exists
    if (!tasksFileExists()) {
      return NextResponse.json(
        { error: 'Tasks file not found' },
        { status: 404 }
      )
    }

    const sections = await getSections()

    return NextResponse.json({
      sections,
      count: sections.length
    })
  } catch (error) {
    console.error('Error fetching sections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sections' },
      { status: 500 }
    )
  }
}
