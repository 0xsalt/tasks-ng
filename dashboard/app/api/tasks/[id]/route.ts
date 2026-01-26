/**
 * Tasks API - Single Task Operations
 *
 * GET /api/tasks/[id] - Get a single task
 * PATCH /api/tasks/[id] - Update a task
 * DELETE /api/tasks/[id] - Delete a task
 */

import { NextResponse } from 'next/server'
import {
  getTask,
  updateTask,
  deleteTask,
  tasksFileExists,
  type UpdateTaskInput,
  type TaskStatus,
  type CheckboxState
} from '@/lib/task-parser'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    // Check if tasks file exists
    if (!tasksFileExists()) {
      return NextResponse.json(
        { error: 'Tasks file not found' },
        { status: 404 }
      )
    }

    const { id } = await params

    const task = await getTask(id)

    if (!task) {
      return NextResponse.json(
        { error: `Task not found: ${id}` },
        { status: 404 }
      )
    }

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    // Check if tasks file exists
    if (!tasksFileExists()) {
      return NextResponse.json(
        { error: 'Tasks file not found' },
        { status: 404 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Check task exists first
    const existingTask = await getTask(id)
    if (!existingTask) {
      return NextResponse.json(
        { error: `Task not found: ${id}` },
        { status: 404 }
      )
    }

    // Build update input
    const input: UpdateTaskInput = {}

    // description
    if (body.description !== undefined) {
      if (typeof body.description !== 'string' || body.description.trim() === '') {
        return NextResponse.json(
          { error: 'description must be a non-empty string' },
          { status: 400 }
        )
      }
      input.description = body.description.trim()
    }

    // status
    if (body.status !== undefined) {
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

    // checkboxState (alternative to status)
    if (body.checkboxState !== undefined) {
      const validStates: CheckboxState[] = [' ', '/', 'x', '-', '>', '?']
      if (!validStates.includes(body.checkboxState)) {
        return NextResponse.json(
          { error: `Invalid checkboxState. Must be one of: ${validStates.map(s => `"${s}"`).join(', ')}` },
          { status: 400 }
        )
      }
      input.checkboxState = body.checkboxState
    }

    // tags
    if (body.tags !== undefined) {
      if (!Array.isArray(body.tags)) {
        return NextResponse.json(
          { error: 'tags must be an array' },
          { status: 400 }
        )
      }
      input.tags = body.tags.map((t: string) => t.toLowerCase())
    }

    // mentions
    if (body.mentions !== undefined) {
      if (!Array.isArray(body.mentions)) {
        return NextResponse.json(
          { error: 'mentions must be an array' },
          { status: 400 }
        )
      }
      input.mentions = body.mentions.map((m: string) => m.toLowerCase())
    }

    // modifiers
    if (body.modifiers !== undefined) {
      if (!Array.isArray(body.modifiers)) {
        return NextResponse.json(
          { error: 'modifiers must be an array' },
          { status: 400 }
        )
      }
      input.modifiers = body.modifiers.map((m: string) => m.toLowerCase())
    }

    // due date
    if (body.due !== undefined) {
      if (body.due !== null && !/^\d{4}-\d{2}-\d{2}$/.test(body.due)) {
        return NextResponse.json(
          { error: 'due must be in YYYY-MM-DD format or null' },
          { status: 400 }
        )
      }
      input.due = body.due || undefined
    }

    // done date
    if (body.done !== undefined) {
      if (body.done !== null && !/^\d{4}-\d{2}-\d{2}$/.test(body.done)) {
        return NextResponse.json(
          { error: 'done must be in YYYY-MM-DD format or null' },
          { status: 400 }
        )
      }
      input.done = body.done || undefined
    }

    // timeSpent
    if (body.timeSpent !== undefined) {
      if (body.timeSpent !== null && (typeof body.timeSpent !== 'number' || body.timeSpent < 0)) {
        return NextResponse.json(
          { error: 'timeSpent must be a non-negative number or null' },
          { status: 400 }
        )
      }
      input.timeSpent = body.timeSpent || undefined
    }

    // Check if any fields to update
    if (Object.keys(input).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const task = await updateTask(id, input)

    return NextResponse.json({
      task,
      message: 'Task updated successfully'
    })
  } catch (error) {
    console.error('Error updating task:', error)

    const message = error instanceof Error ? error.message : 'Failed to update task'
    const status = message.includes('not found') ? 404 : 500

    return NextResponse.json(
      { error: message },
      { status }
    )
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    // Check if tasks file exists
    if (!tasksFileExists()) {
      return NextResponse.json(
        { error: 'Tasks file not found' },
        { status: 404 }
      )
    }

    const { id } = await params

    // Check task exists first
    const existingTask = await getTask(id)
    if (!existingTask) {
      return NextResponse.json(
        { error: `Task not found: ${id}` },
        { status: 404 }
      )
    }

    await deleteTask(id)

    return NextResponse.json({
      message: 'Task deleted successfully',
      deletedId: id
    })
  } catch (error) {
    console.error('Error deleting task:', error)

    const message = error instanceof Error ? error.message : 'Failed to delete task'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
