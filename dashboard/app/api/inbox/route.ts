/**
 * Inbox API Route
 *
 * POST /api/inbox - Append raw text to INBOX section
 *
 * Used for "brain dump" quick capture - unstructured text
 * that can be processed later.
 */

import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { withLock } from '@/lib/file-lock'

export const dynamic = 'force-dynamic'

const TASKS_FILE = process.env.TASKS_FILE || path.join(os.homedir(), 'tasks.md')

/**
 * Ensure INBOX section exists and get its position
 */
function findOrCreateInboxPosition(lines: string[]): number {
  // Look for existing ## INBOX section
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line?.trim() === '## INBOX') {
      // Return position after the header
      return i + 1
    }
  }

  // INBOX section doesn't exist - we'll add it at the end
  return -1
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text } = body

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'text is required' },
        { status: 400 }
      )
    }

    const trimmedText = text.trim()
    if (!trimmedText) {
      return NextResponse.json(
        { error: 'text cannot be empty' },
        { status: 400 }
      )
    }

    await withLock(TASKS_FILE, async () => {
      // Read current file
      let content: string
      try {
        content = await fs.readFile(TASKS_FILE, 'utf-8')
      } catch {
        content = ''
      }

      const lines = content.split('\n')
      const inboxPos = findOrCreateInboxPosition(lines)

      // Format the brain dump entry with timestamp
      const timestamp = new Date().toISOString().split('T')[0]
      const entry = `- ${trimmedText} _created:${timestamp}`

      if (inboxPos === -1) {
        // Add INBOX section at the end
        lines.push('')
        lines.push('## INBOX')
        lines.push(entry)
      } else {
        // Insert after INBOX header
        lines.splice(inboxPos, 0, entry)
      }

      // Write back
      const tempPath = `${TASKS_FILE}.tmp`
      await fs.writeFile(tempPath, lines.join('\n'), 'utf-8')
      await fs.rename(tempPath, TASKS_FILE)
    })

    return NextResponse.json({
      success: true,
      message: 'Added to INBOX'
    })

  } catch (error) {
    console.error('Failed to add to inbox:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add to inbox' },
      { status: 500 }
    )
  }
}
