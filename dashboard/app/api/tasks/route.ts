/**
 * Tasks API - List and Create
 *
 * GET /api/tasks - List tasks with optional filters
 * POST /api/tasks - Create a new task
 */

import { NextResponse } from 'next/server'
import {
  getTasks,
  insertTask,
  tasksFileExists,
  type TaskFilters,
  type TaskStatus,
  type EisenhowerQuadrant,
  type CreateTaskInput
} from '@/lib/task-parser'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Check if tasks file exists
    if (!tasksFileExists()) {
      return NextResponse.json(
        { error: 'Tasks file not found. Set TASKS_FILE environment variable or create ~/tasks.md' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const filters: TaskFilters = {}

    // status - comma-separated list
    const statusParam = searchParams.get('status')
    if (statusParam) {
      filters.status = statusParam.split(',').map(s => s.trim()) as TaskStatus[]
    }

    // tags - comma-separated list
    const tagsParam = searchParams.get('tags')
    if (tagsParam) {
      filters.tags = tagsParam.split(',').map(t => t.trim())
    }

    // section - single value
    const sectionParam = searchParams.get('section')
    if (sectionParam) {
      filters.section = sectionParam
    }

    // quadrant - single value (Q1, Q2, Q3, Q4)
    const quadrantParam = searchParams.get('quadrant')
    if (quadrantParam && ['Q1', 'Q2', 'Q3', 'Q4'].includes(quadrantParam)) {
      filters.quadrant = quadrantParam as EisenhowerQuadrant
    }

    // includeCompleted - boolean
    const includeCompletedParam = searchParams.get('includeCompleted')
    if (includeCompletedParam === 'true') {
      filters.includeCompleted = true
    }

    // flat - boolean (return flat list vs tree)
    const flatParam = searchParams.get('flat')
    if (flatParam === 'true') {
      filters.flat = true
    }

    const tasks = await getTasks(filters)

    return NextResponse.json({
      tasks,
      count: tasks.length,
      filters
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    // Check if tasks file exists
    if (!tasksFileExists()) {
      return NextResponse.json(
        { error: 'Tasks file not found. Set TASKS_FILE environment variable or create ~/tasks.md' },
        { status: 404 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.description || typeof body.description !== 'string') {
      return NextResponse.json(
        { error: 'description is required and must be a string' },
        { status: 400 }
      )
    }

    // Build input
    const input: CreateTaskInput = {
      description: body.description.trim()
    }

    // Optional fields
    if (body.status) {
      const validStatuses: TaskStatus[] = [
        'pending', 'in_progress', 'completed', 'cancelled', 'deferred', 'blocked'
      ]
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        )
      }
      input.status = body.status
    }

    if (body.section) {
      input.section = body.section
    }

    if (body.parentId) {
      input.parentId = body.parentId
    }

    if (body.tags && Array.isArray(body.tags)) {
      input.tags = body.tags.map((t: string) => t.toLowerCase())
    }

    if (body.mentions && Array.isArray(body.mentions)) {
      input.mentions = body.mentions.map((m: string) => m.toLowerCase())
    }

    if (body.modifiers && Array.isArray(body.modifiers)) {
      input.modifiers = body.modifiers.map((m: string) => m.toLowerCase())
    }

    if (body.due && /^\d{4}-\d{2}-\d{2}$/.test(body.due)) {
      input.due = body.due
    }

    if (typeof body.timeSpent === 'number' && body.timeSpent >= 0) {
      input.timeSpent = body.timeSpent
    }

    const task = await insertTask(input)

    return NextResponse.json({
      task,
      message: 'Task created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)

    const message = error instanceof Error ? error.message : 'Failed to create task'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
