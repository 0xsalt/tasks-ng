/**
 * Task line builder - converts Task objects back to markdown
 * Pure functions - no side effects
 */

import type { BuildTaskLineOptions, Task } from './types.js'

/**
 * Build a task line from components
 *
 * @example
 * ```ts
 * const line = buildTaskLine({
 *   description: 'Fix the bug',
 *   checkboxState: ' ',
 *   tags: ['backend'],
 *   modifiers: ['urgent']
 * })
 * // Returns: "- [ ] Fix the bug #backend +urgent"
 * ```
 */
export function buildTaskLine(options: BuildTaskLineOptions): string {
  const {
    description,
    checkboxState = ' ',
    level = 0,
    tags = [],
    mentions = [],
    modifiers = [],
    dates = {},
    timeSpent
  } = options

  const indent = '    '.repeat(level)
  const checkbox = `- [${checkboxState}]`

  const parts = [description]

  // Add tags
  for (const tag of tags) {
    parts.push(`#${tag}`)
  }

  // Add mentions
  for (const mention of mentions) {
    parts.push(`@${mention}`)
  }

  // Add modifiers
  for (const mod of modifiers) {
    parts.push(`+${mod}`)
  }

  // Add dates
  if (dates.due) parts.push(`_due:${dates.due}`)
  if (dates.done) parts.push(`_done:${dates.done}`)
  if (dates.created) parts.push(`_created:${dates.created}`)

  // Add time spent
  if (timeSpent !== undefined) parts.push(`_spent:${timeSpent}`)

  return `${indent}${checkbox} ${parts.join(' ')}`
}

/**
 * Build a task line from a Task object
 * Useful for round-tripping: parse → modify → serialize
 */
export function taskToLine(task: Task): string {
  return buildTaskLine({
    description: task.description,
    checkboxState: task.checkboxState,
    level: task.level,
    tags: task.tags,
    mentions: task.mentions,
    modifiers: task.modifiers,
    dates: task.dates,
    timeSpent: task.timeSpent
  })
}

/**
 * Update a task line with new values
 * Returns the new line string
 */
export function updateTaskLine(
  task: Task,
  updates: Partial<BuildTaskLineOptions>
): string {
  return buildTaskLine({
    description: updates.description ?? task.description,
    checkboxState: updates.checkboxState ?? task.checkboxState,
    level: updates.level ?? task.level,
    tags: updates.tags ?? task.tags,
    mentions: updates.mentions ?? task.mentions,
    modifiers: updates.modifiers ?? task.modifiers,
    dates: updates.dates ?? task.dates,
    timeSpent: updates.timeSpent ?? task.timeSpent
  })
}

/**
 * Replace a task line in content
 * Returns the new content string
 */
export function replaceTaskLine(
  content: string,
  lineNumber: number,
  newLine: string
): string {
  const lines = content.split('\n')
  const index = lineNumber - 1 // Convert to 0-indexed

  if (index < 0 || index >= lines.length) {
    throw new Error(`Invalid line number: ${lineNumber}`)
  }

  lines[index] = newLine
  return lines.join('\n')
}

/**
 * Insert a new line into content at position
 * Returns the new content string
 */
export function insertLine(
  content: string,
  lineNumber: number,
  newLine: string
): string {
  const lines = content.split('\n')
  const index = lineNumber - 1 // Convert to 0-indexed

  // Allow inserting at end
  if (index < 0 || index > lines.length) {
    throw new Error(`Invalid line number: ${lineNumber}`)
  }

  lines.splice(index, 0, newLine)
  return lines.join('\n')
}

/**
 * Delete a line from content
 * Returns the new content string
 */
export function deleteLine(content: string, lineNumber: number): string {
  const lines = content.split('\n')
  const index = lineNumber - 1 // Convert to 0-indexed

  if (index < 0 || index >= lines.length) {
    throw new Error(`Invalid line number: ${lineNumber}`)
  }

  lines.splice(index, 1)
  return lines.join('\n')
}

/**
 * Delete multiple lines from content (handles index shifting)
 * Lines should be provided in any order - will be sorted and processed correctly
 */
export function deleteLines(content: string, lineNumbers: number[]): string {
  // Sort in descending order to delete from end first (avoids index shifting issues)
  const sorted = [...lineNumbers].sort((a, b) => b - a)

  let result = content
  for (const lineNum of sorted) {
    result = deleteLine(result, lineNum)
  }

  return result
}
