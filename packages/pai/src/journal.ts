/**
 * Journal integration for task completions
 *
 * Logs task state changes to private-journal skill
 */

import { spawn } from 'child_process'
import path from 'path'
import type { Task } from '@tasks-ng/parser'
import { hasJournalSkill, getJournalSkillPath } from './config.js'

export interface JournalEntry {
  type: 'task-completed' | 'task-started' | 'task-created' | 'task-cancelled'
  task: Task
  timestamp: Date
  notes?: string
}

/**
 * Log a task event to the journal
 */
export async function logToJournal(entry: JournalEntry): Promise<boolean> {
  if (!hasJournalSkill()) {
    return false
  }

  const journalPath = getJournalSkillPath()
  if (!journalPath) {
    return false
  }

  const cliPath = path.join(journalPath, 'dist', 'cli', 'write-journal.js')

  // Build journal content based on entry type
  const content = buildJournalContent(entry)

  return new Promise((resolve) => {
    const proc = spawn('node', [
      cliPath,
      '--project-notes',
      content
    ], {
      stdio: 'pipe'
    })

    proc.on('close', (code) => {
      resolve(code === 0)
    })

    proc.on('error', () => {
      resolve(false)
    })
  })
}

/**
 * Build journal content from entry
 */
function buildJournalContent(entry: JournalEntry): string {
  const { type, task, timestamp, notes } = entry
  const date = timestamp.toISOString().split('T')[0]

  const tags = task.tags.length > 0 ? ` [${task.tags.map(t => `#${t}`).join(' ')}]` : ''
  const section = task.section ? ` in ${task.section}` : ''

  let action: string
  switch (type) {
    case 'task-completed':
      action = 'Completed'
      break
    case 'task-started':
      action = 'Started'
      break
    case 'task-created':
      action = 'Created'
      break
    case 'task-cancelled':
      action = 'Cancelled'
      break
  }

  let content = `${action} task: "${task.description}"${tags}${section}.`

  if (notes) {
    content += ` ${notes}`
  }

  content += ` Search keywords: task-${type}, ${task.tags.join(', ')}`

  return content
}

/**
 * Log task completion to journal
 */
export async function logTaskCompleted(task: Task, notes?: string): Promise<boolean> {
  return logToJournal({
    type: 'task-completed',
    task,
    timestamp: new Date(),
    notes
  })
}

/**
 * Log task start to journal
 */
export async function logTaskStarted(task: Task, notes?: string): Promise<boolean> {
  return logToJournal({
    type: 'task-started',
    task,
    timestamp: new Date(),
    notes
  })
}

/**
 * Log task creation to journal
 */
export async function logTaskCreated(task: Task, notes?: string): Promise<boolean> {
  return logToJournal({
    type: 'task-created',
    task,
    timestamp: new Date(),
    notes
  })
}

/**
 * Log task cancellation to journal
 */
export async function logTaskCancelled(task: Task, notes?: string): Promise<boolean> {
  return logToJournal({
    type: 'task-cancelled',
    task,
    timestamp: new Date(),
    notes
  })
}
