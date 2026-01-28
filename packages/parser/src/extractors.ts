/**
 * Pure extraction functions for parsing task metadata
 * No dependencies - works in any JS runtime
 */

import type { CheckboxState, TaskStatus, TaskDates } from './types.js'

// Regex patterns from SPEC.md
export const CHECKBOX_REGEX = /^(\s*)- \[([ /x\->?])\]\s*/
export const TAG_REGEX = /#[a-z0-9-]+/gi
export const MENTION_REGEX = /@[a-z0-9-]+/gi
export const MODIFIER_REGEX = /\+[a-z]+(?::[a-z0-9-]+)?/gi
export const DATE_REGEX = /_([a-z]+):(\d{4}-\d{2}-\d{2})/gi
export const TIME_SPENT_REGEX = /_spent:(\d+)/i
export const SECTION_H2_REGEX = /^##\s+(.+)$/
export const SECTION_H3_REGEX = /^###\s+(.+)$/

/**
 * Map checkbox state to semantic task status
 */
export function checkboxToStatus(state: CheckboxState): TaskStatus {
  switch (state) {
    case ' ':
      return 'pending'
    case '/':
      return 'in_progress'
    case 'x':
      return 'completed'
    case '-':
      return 'cancelled'
    case '>':
      return 'deferred'
    case '?':
      return 'blocked'
    default:
      return 'pending'
  }
}

/**
 * Map semantic status to checkbox state
 */
export function statusToCheckbox(status: TaskStatus): CheckboxState {
  switch (status) {
    case 'pending':
      return ' '
    case 'in_progress':
      return '/'
    case 'completed':
      return 'x'
    case 'cancelled':
      return '-'
    case 'deferred':
      return '>'
    case 'blocked':
      return '?'
    default:
      return ' '
  }
}

/**
 * Generate a simple hash from content (no crypto dependency)
 * Uses a basic string hash algorithm
 */
export function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  // Convert to hex and take 6 chars
  return Math.abs(hash).toString(16).padStart(6, '0').slice(0, 6)
}

/**
 * Generate task ID: L{lineNumber}_{contentHash}
 */
export function generateTaskId(lineNumber: number, content: string): string {
  const hash = simpleHash(content)
  return `L${lineNumber}_${hash}`
}

/**
 * Extract tags (#tag) from line
 */
export function extractTags(line: string): string[] {
  const matches = line.match(TAG_REGEX)
  return matches ? matches.map(t => t.slice(1).toLowerCase()) : []
}

/**
 * Extract mentions (@mention) from line
 */
export function extractMentions(line: string): string[] {
  const matches = line.match(MENTION_REGEX)
  return matches ? matches.map(m => m.slice(1).toLowerCase()) : []
}

/**
 * Extract modifiers (+modifier or +modifier:value) from line
 */
export function extractModifiers(line: string): string[] {
  const matches = line.match(MODIFIER_REGEX)
  return matches ? matches.map(m => m.slice(1).toLowerCase()) : []
}

/**
 * Extract date metadata from line
 */
export function extractDates(line: string): TaskDates {
  const dates: TaskDates = {}
  let match: RegExpExecArray | null

  // Reset regex lastIndex for global regex
  const dateRegex = new RegExp(DATE_REGEX.source, 'gi')

  while ((match = dateRegex.exec(line)) !== null) {
    const key = match[1]?.toLowerCase()
    const value = match[2]

    if (key === 'due' && value) dates.due = value
    else if (key === 'done' && value) dates.done = value
    else if (key === 'created' && value) dates.created = value
  }

  return dates
}

/**
 * Extract time spent in minutes from line
 */
export function extractTimeSpent(line: string): number | undefined {
  const match = line.match(TIME_SPENT_REGEX)
  return match?.[1] ? parseInt(match[1], 10) : undefined
}

/**
 * Extract description text (between checkbox and metadata tokens)
 */
export function extractDescription(line: string): string {
  // Remove checkbox
  let desc = line.replace(CHECKBOX_REGEX, '')

  // Remove all metadata tokens
  desc = desc.replace(TAG_REGEX, '')
  desc = desc.replace(MENTION_REGEX, '')
  desc = desc.replace(MODIFIER_REGEX, '')
  desc = desc.replace(new RegExp(DATE_REGEX.source, 'gi'), '')
  desc = desc.replace(TIME_SPENT_REGEX, '')
  desc = desc.replace(/\*\*/g, '') // Remove bold markers

  return desc.trim()
}

/**
 * Calculate indentation level (4 spaces per level)
 */
export function getIndentLevel(line: string): number {
  const match = line.match(/^(\s*)/)
  if (!match?.[1]) return 0
  const spaces = match[1].length
  return Math.floor(spaces / 4)
}

/**
 * Check if a line is a task (starts with checkbox)
 */
export function isTaskLine(line: string): boolean {
  return CHECKBOX_REGEX.test(line)
}

/**
 * Extract checkbox state from line
 */
export function extractCheckboxState(line: string): CheckboxState | null {
  const match = line.match(CHECKBOX_REGEX)
  if (!match) return null
  return match[2] as CheckboxState
}
