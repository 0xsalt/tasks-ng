/**
 * Task Parser Module for tasks-ng
 *
 * Parses tasks.md files into structured Task objects and provides
 * file operations for CRUD functionality.
 *
 * Based on SPEC.md v2.0.0
 */

import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'
import os from 'os'
import crypto from 'crypto'
import { withLock } from './file-lock'

// ============================================================================
// Types
// ============================================================================

export type CheckboxState = ' ' | '/' | 'x' | '-' | '>' | '?'

export type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'deferred'
  | 'blocked'

export interface TaskDates {
  due?: string
  done?: string
  created?: string
  last_in_progress?: string // Timestamp when task last left in-progress state
}

export interface Task {
  id: string
  lineNumber: number
  description: string
  rawLine: string
  checkboxState: CheckboxState
  status: TaskStatus
  level: number // Nesting 0-3
  parentId?: string
  children: Task[]
  tags: string[]
  mentions: string[]
  modifiers: string[]
  dates: TaskDates
  timeSpent?: number
  isUrgent: boolean
  isImportant: boolean
  section: string
}

export interface ParsedFile {
  tasks: Task[]
  sections: string[]
  rawContent: string
  lines: string[]
}

export interface CreateTaskInput {
  description: string
  status?: TaskStatus
  section?: string
  parentId?: string
  tags?: string[]
  mentions?: string[]
  modifiers?: string[]
  due?: string
  timeSpent?: number
}

export interface UpdateTaskInput {
  description?: string
  status?: TaskStatus
  checkboxState?: CheckboxState
  tags?: string[]
  mentions?: string[]
  modifiers?: string[]
  due?: string
  done?: string
  timeSpent?: number
}

export type EisenhowerQuadrant = 'Q1' | 'Q2' | 'Q3' | 'Q4'

export interface EisenhowerMatrix {
  Q1: Task[] // Urgent + Important: Do first
  Q2: Task[] // Important: Schedule
  Q3: Task[] // Urgent: Delegate
  Q4: Task[] // Neither: Consider dropping
}

// ============================================================================
// Constants
// ============================================================================

// XDG Base Directory compliant: ~/.local/share/tasks-ng/tasks.md
// Falls back to ~/tasks.md for legacy compatibility
const XDG_DATA_HOME = process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share')
const DEFAULT_TASKS_FILE = path.join(XDG_DATA_HOME, 'tasks-ng', 'tasks.md')
const LEGACY_TASKS_FILE = path.join(os.homedir(), 'tasks.md')

// Priority: TASKS_FILE env > XDG path (if exists) > legacy path
function resolveTasksFile(): string {
  if (process.env.TASKS_FILE) return process.env.TASKS_FILE
  if (fsSync.existsSync(DEFAULT_TASKS_FILE)) return DEFAULT_TASKS_FILE
  return LEGACY_TASKS_FILE
}

const TASKS_FILE = resolveTasksFile()
const BACKUP_DIR = path.join(path.dirname(TASKS_FILE), '.task-backups')

// Regex patterns from SPEC.md
const CHECKBOX_REGEX = /^(\s*)- \[([ /x\->?])\]\s*/
const TAG_REGEX = /#[a-z0-9-]+/gi
const MENTION_REGEX = /@[a-z0-9-]+/gi
const MODIFIER_REGEX = /\+[a-z]+(?::[a-z0-9-]+)?/gi
// Match both date-only (2026-01-28) and ISO timestamps (2026-01-28T16:30:00.000Z)
// Also match last_in_progress with underscores: _last_in_progress:2026-01-28T16:30:00.000Z
const DATE_REGEX = /_([a-z_]+):(\d{4}-\d{2}-\d{2}(?:T[\d:.]+Z)?)/gi
const TIME_SPENT_REGEX = /_spent:(\d+)/i
const SECTION_H2_REGEX = /^##\s+(.+)$/
const SECTION_H3_REGEX = /^###\s+(.+)$/

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Map checkbox state to task status
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
 * Map task status to checkbox state
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
 * Generate task ID: L{lineNumber}_{contentHash}
 */
export function generateTaskId(lineNumber: number, content: string): string {
  const hash = crypto.createHash('md5').update(content).digest('hex').substring(0, 6)
  return `L${lineNumber}_${hash}`
}

/**
 * Extract Eisenhower quadrant from task
 */
export function getQuadrant(task: Task): EisenhowerQuadrant {
  if (task.isUrgent && task.isImportant) return 'Q1'
  if (task.isImportant) return 'Q2'
  if (task.isUrgent) return 'Q3'
  return 'Q4'
}

/**
 * Parse tags from line
 */
function extractTags(line: string): string[] {
  const matches = line.match(TAG_REGEX)
  return matches ? matches.map(t => t.slice(1).toLowerCase()) : []
}

/**
 * Parse mentions from line
 */
function extractMentions(line: string): string[] {
  const matches = line.match(MENTION_REGEX)
  return matches ? matches.map(m => m.slice(1).toLowerCase()) : []
}

/**
 * Parse modifiers from line
 */
function extractModifiers(line: string): string[] {
  const matches = line.match(MODIFIER_REGEX)
  return matches ? matches.map(m => m.slice(1).toLowerCase()) : []
}

/**
 * Parse dates from line
 */
function extractDates(line: string): TaskDates {
  const dates: TaskDates = {}
  let match: RegExpExecArray | null

  // Reset regex lastIndex
  DATE_REGEX.lastIndex = 0

  while ((match = DATE_REGEX.exec(line)) !== null) {
    const key = match[1]?.toLowerCase()
    const value = match[2]

    if (key === 'due' && value) dates.due = value
    else if (key === 'done' && value) dates.done = value
    else if (key === 'created' && value) dates.created = value
    else if (key === 'last_in_progress' && value) dates.last_in_progress = value
  }

  return dates
}

/**
 * Extract time spent from line
 */
function extractTimeSpent(line: string): number | undefined {
  const match = line.match(TIME_SPENT_REGEX)
  return match?.[1] ? parseInt(match[1], 10) : undefined
}

/**
 * Extract description (text between checkbox and metadata)
 */
function extractDescription(line: string): string {
  // Remove checkbox
  let desc = line.replace(CHECKBOX_REGEX, '')

  // Remove all metadata tokens
  desc = desc.replace(TAG_REGEX, '')
  desc = desc.replace(MENTION_REGEX, '')
  desc = desc.replace(MODIFIER_REGEX, '')
  desc = desc.replace(DATE_REGEX, '')
  desc = desc.replace(TIME_SPENT_REGEX, '')
  desc = desc.replace(/\*\*/g, '') // Remove bold markers

  return desc.trim()
}

/**
 * Calculate indentation level
 */
function getIndentLevel(line: string): number {
  const match = line.match(/^(\s*)/)
  if (!match?.[1]) return 0
  const spaces = match[1].length
  return Math.floor(spaces / 4)
}

// ============================================================================
// Parser Functions
// ============================================================================

/**
 * Parse a single line into a Task object
 */
export function parseLine(line: string, lineNumber: number, section: string): Task | null {
  const checkboxMatch = line.match(CHECKBOX_REGEX)
  if (!checkboxMatch) return null

  const checkboxState = checkboxMatch[2] as CheckboxState
  const level = getIndentLevel(line)

  // Validate max nesting depth
  if (level > 3) return null

  const tags = extractTags(line)
  const modifiers = extractModifiers(line)
  const isUrgent = modifiers.includes('urgent')
  const isImportant = modifiers.includes('important')

  const task: Task = {
    id: generateTaskId(lineNumber, line),
    lineNumber,
    description: extractDescription(line),
    rawLine: line,
    checkboxState,
    status: checkboxToStatus(checkboxState),
    level,
    children: [],
    tags,
    mentions: extractMentions(line),
    modifiers,
    dates: extractDates(line),
    timeSpent: extractTimeSpent(line),
    isUrgent,
    isImportant,
    section
  }

  return task
}

/**
 * Parse entire tasks.md file
 */
export function parseTasksFile(content: string): ParsedFile {
  const lines = content.split('\n')
  const tasks: Task[] = []
  const sections: string[] = []
  let currentSection = 'Unsorted'

  // First pass: parse all tasks
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line === undefined) continue
    const lineNumber = i + 1 // 1-indexed

    // Track sections
    const h2Match = line.match(SECTION_H2_REGEX)
    if (h2Match?.[1]) {
      currentSection = h2Match[1].trim()
      if (!sections.includes(currentSection)) {
        sections.push(currentSection)
      }
      continue
    }

    const h3Match = line.match(SECTION_H3_REGEX)
    if (h3Match?.[1]) {
      currentSection = h3Match[1].trim()
      if (!sections.includes(currentSection)) {
        sections.push(currentSection)
      }
      continue
    }

    // Parse task
    const task = parseLine(line, lineNumber, currentSection)
    if (task) {
      tasks.push(task)
    }
  }

  // Second pass: build parent-child relationships
  buildTaskTree(tasks)

  return {
    tasks,
    sections,
    rawContent: content,
    lines
  }
}

/**
 * Build parent-child relationships based on indentation
 */
function buildTaskTree(tasks: Task[]): void {
  const stack: Task[] = []

  for (const task of tasks) {
    // Pop tasks from stack until we find parent level
    let top = stack[stack.length - 1]
    while (stack.length > 0 && top && top.level >= task.level) {
      stack.pop()
      top = stack[stack.length - 1]
    }

    // If stack has items, top is our parent
    const parent = stack[stack.length - 1]
    if (parent) {
      task.parentId = parent.id
      parent.children.push(task)
    }

    // Push current task to stack
    stack.push(task)
  }
}

// ============================================================================
// File Operations
// ============================================================================

/**
 * Get tasks file path
 */
export function getTasksFilePath(): string {
  return TASKS_FILE
}

/**
 * Read tasks.md file
 */
export async function readTasksFile(): Promise<ParsedFile> {
  const content = await fs.readFile(TASKS_FILE, 'utf-8')
  return parseTasksFile(content)
}

/**
 * Create backup of tasks.md
 */
async function createBackup(content: string): Promise<string> {
  // Ensure backup directory exists
  await fs.mkdir(BACKUP_DIR, { recursive: true })

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupPath = path.join(BACKUP_DIR, `tasks-${timestamp}.md`)

  await fs.writeFile(backupPath, content, 'utf-8')

  // Clean old backups (keep last 50)
  const backups = await fs.readdir(BACKUP_DIR)
  const sortedBackups = backups
    .filter(f => f.startsWith('tasks-') && f.endsWith('.md'))
    .sort()

  if (sortedBackups.length > 50) {
    const toDelete = sortedBackups.slice(0, sortedBackups.length - 50)
    for (const file of toDelete) {
      await fs.unlink(path.join(BACKUP_DIR, file))
    }
  }

  return backupPath
}

/**
 * Write tasks.md file with atomic write and backup
 */
export async function writeTasksFile(content: string): Promise<void> {
  await withLock(TASKS_FILE, async () => {
    // Read current content for backup
    let currentContent = ''
    try {
      currentContent = await fs.readFile(TASKS_FILE, 'utf-8')
    } catch {
      // File may not exist yet
    }

    // Create backup if file has content
    if (currentContent) {
      await createBackup(currentContent)
    }

    // Atomic write: write to temp file then rename
    const tempPath = `${TASKS_FILE}.tmp`
    await fs.writeFile(tempPath, content, 'utf-8')
    await fs.rename(tempPath, TASKS_FILE)
  })
}

/**
 * Build a task line from components
 */
export function buildTaskLine(
  description: string,
  checkboxState: CheckboxState,
  level: number,
  tags: string[],
  mentions: string[],
  modifiers: string[],
  dates: TaskDates,
  timeSpent?: number
): string {
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
  if (dates.last_in_progress) parts.push(`_last_in_progress:${dates.last_in_progress}`)

  // Add time spent
  if (timeSpent !== undefined) parts.push(`_spent:${timeSpent}`)

  return `${indent}${checkbox} ${parts.join(' ')}`
}

/**
 * Find the line number to insert a new task in a section
 * Returns the line number after the section header or after the last task in section
 */
function findInsertPosition(
  lines: string[],
  section: string,
  parentId?: string,
  tasks?: Task[]
): number {
  // If we have a parent, insert after parent
  if (parentId && tasks) {
    const parent = tasks.find(t => t.id === parentId)
    if (parent) {
      // Find last child of parent, or insert right after parent
      const lastChildLine = parent.children.length > 0
        ? Math.max(...parent.children.map(c => c.lineNumber))
        : parent.lineNumber
      return lastChildLine + 1
    }
  }

  // Find section and insert after header or last task in section
  let inSection = false
  let lastTaskLine = -1
  let sectionStartLine = -1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line === undefined) continue

    // Check for section header
    const h2Match = line.match(SECTION_H2_REGEX)
    const h3Match = line.match(SECTION_H3_REGEX)

    if (h2Match?.[1] || h3Match?.[1]) {
      const sectionName = (h2Match?.[1] ?? h3Match?.[1] ?? '').trim()

      if (sectionName === section) {
        inSection = true
        sectionStartLine = i + 1
        continue
      } else if (inSection) {
        // We've left our section
        break
      }
    }

    // Track last task line in section
    if (inSection && CHECKBOX_REGEX.test(line)) {
      lastTaskLine = i
    }
  }

  // Return position: after last task in section, or after section header
  if (lastTaskLine >= 0) return lastTaskLine + 2 // 1-indexed + after
  if (sectionStartLine >= 0) return sectionStartLine + 1
  return lines.length + 1 // Append to end
}

/**
 * Insert a new task
 */
export async function insertTask(input: CreateTaskInput): Promise<Task> {
  const parsed = await readTasksFile()
  const lines = [...parsed.lines]

  // Determine checkbox state
  const checkboxState = input.status ? statusToCheckbox(input.status) : ' '

  // Build modifiers including urgent/important if specified
  const modifiers = [...(input.modifiers || [])]

  // Determine level from parent
  let level = 0
  if (input.parentId) {
    const parent = parsed.tasks.find(t => t.id === input.parentId)
    if (parent) {
      level = parent.level + 1
      if (level > 3) {
        throw new Error('Maximum nesting depth (3) exceeded')
      }
    }
  }

  // Build task line
  const taskLine = buildTaskLine(
    input.description,
    checkboxState,
    level,
    input.tags || [],
    input.mentions || [],
    modifiers,
    { due: input.due },
    input.timeSpent
  )

  // Find insert position
  const insertLineNum = findInsertPosition(
    lines,
    input.section || 'Unsorted',
    input.parentId,
    parsed.tasks
  )

  // Insert line (convert to 0-indexed)
  const insertIndex = insertLineNum - 1
  lines.splice(insertIndex, 0, taskLine)

  // Write back
  await writeTasksFile(lines.join('\n'))

  // Re-parse and return the new task
  const newParsed = await readTasksFile()
  const newTask = newParsed.tasks.find(
    t => t.lineNumber === insertLineNum && t.description === input.description
  )

  if (!newTask) {
    throw new Error('Failed to create task')
  }

  return newTask
}

/**
 * Update a task
 */
export async function updateTask(taskId: string, input: UpdateTaskInput): Promise<Task> {
  const parsed = await readTasksFile()
  const lines = [...parsed.lines]

  // Find task
  const task = parsed.tasks.find(t => t.id === taskId)
  if (!task) {
    throw new Error(`Task not found: ${taskId}`)
  }

  // Merge updates
  const checkboxState = input.checkboxState ?? (input.status ? statusToCheckbox(input.status) : task.checkboxState)
  const description = input.description ?? task.description
  const tags = input.tags ?? task.tags
  const mentions = input.mentions ?? task.mentions
  const modifiers = input.modifiers ?? task.modifiers
  const dates: TaskDates = {
    due: input.due ?? task.dates.due,
    done: input.done ?? task.dates.done,
    created: task.dates.created,
    last_in_progress: task.dates.last_in_progress
  }
  const timeSpent = input.timeSpent ?? task.timeSpent

  // Track when task leaves in-progress state (for Current Focus grace period)
  // Option A: Full grace period - show any task that was in-progress within 12 hours
  if (task.checkboxState === '/' && checkboxState !== '/') {
    // Task is moving FROM in-progress TO something else
    dates.last_in_progress = new Date().toISOString()
  }

  // Validation: If completing, require done date
  // IMPORTANT: Store full ISO timestamp for accurate grace period calculation
  if (checkboxState === 'x' && !dates.done) {
    dates.done = new Date().toISOString() // Full timestamp: 2026-01-28T16:30:00.000Z
  }

  // Validation: Parent can only be completed if all children are done/cancelled
  if (checkboxState === 'x' && task.children.length > 0) {
    const incompletChildren = task.children.filter(
      c => c.checkboxState !== 'x' && c.checkboxState !== '-'
    )
    if (incompletChildren.length > 0) {
      throw new Error('Cannot complete parent task: children not complete')
    }
  }

  // TODO: Make single-task-in-progress enforcement a settings page toggle
  // Default: Allow multiple tasks in progress
  // Optional: Enforce only one task in progress at a time
  // Validation commented out per user request 2026-01-27
  // if (checkboxState === '/' && task.checkboxState !== '/') {
  //   const existingInProgress = parsed.tasks.find(
  //     t => t.id !== taskId && t.checkboxState === '/'
  //   )
  //   if (existingInProgress) {
  //     throw new Error(
  //       `Cannot start task: another task is already in progress (${existingInProgress.id})`
  //     )
  //   }
  // }

  // Build new line
  const newLine = buildTaskLine(
    description,
    checkboxState,
    task.level,
    tags,
    mentions,
    modifiers,
    dates,
    timeSpent
  )

  // Replace line (convert to 0-indexed)
  lines[task.lineNumber - 1] = newLine

  // Write back
  await writeTasksFile(lines.join('\n'))

  // Re-parse and return updated task
  const newParsed = await readTasksFile()
  const updatedTask = newParsed.tasks.find(t => t.lineNumber === task.lineNumber)

  if (!updatedTask) {
    throw new Error('Failed to update task')
  }

  return updatedTask
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: string): Promise<void> {
  const parsed = await readTasksFile()
  const lines = [...parsed.lines]

  // Find task
  const task = parsed.tasks.find(t => t.id === taskId)
  if (!task) {
    throw new Error(`Task not found: ${taskId}`)
  }

  // Collect all lines to delete (task + children)
  const linesToDelete: number[] = [task.lineNumber]

  function collectChildLines(t: Task) {
    for (const child of t.children) {
      linesToDelete.push(child.lineNumber)
      collectChildLines(child)
    }
  }
  collectChildLines(task)

  // Sort in reverse order to delete from end
  linesToDelete.sort((a, b) => b - a)

  // Delete lines
  for (const lineNum of linesToDelete) {
    lines.splice(lineNum - 1, 1)
  }

  // Write back
  await writeTasksFile(lines.join('\n'))
}

/**
 * Get a single task by ID
 */
export async function getTask(taskId: string): Promise<Task | null> {
  const parsed = await readTasksFile()
  return parsed.tasks.find(t => t.id === taskId) || null
}

/**
 * Get all tasks with optional filters
 */
export interface TaskFilters {
  status?: TaskStatus[]
  tags?: string[]
  section?: string
  quadrant?: EisenhowerQuadrant
  includeCompleted?: boolean
  flat?: boolean
}

export async function getTasks(filters: TaskFilters = {}): Promise<Task[]> {
  const parsed = await readTasksFile()
  let tasks = parsed.tasks

  // Filter by status
  if (filters.status && filters.status.length > 0) {
    tasks = tasks.filter(t => filters.status!.includes(t.status))
  } else if (!filters.includeCompleted) {
    // Default: exclude completed and cancelled
    // BUT keep completed tasks visible for 12 hours (grace period for undo)
    const GRACE_PERIOD_HOURS = 12
    const now = new Date()

    console.log(`[BACKEND getTasks] Starting grace period filter. Now: ${now.toISOString()}`)
    console.log(`[BACKEND getTasks] Completed tasks before filter:`, tasks.filter(t => t.status === 'completed').map(t => ({
      desc: t.description.substring(0, 40),
      done: t.dates.done,
      status: t.status
    })))

    tasks = tasks.filter(t => {
      // Always show non-completed/non-cancelled tasks
      if (t.status !== 'completed' && t.status !== 'cancelled') return true

      // For completed/cancelled: check if done within grace period
      if (t.dates.done) {
        const doneDate = new Date(t.dates.done)
        const hoursAgo = (now.getTime() - doneDate.getTime()) / (1000 * 60 * 60)
        const withinPeriod = hoursAgo < GRACE_PERIOD_HOURS

        console.log(`[BACKEND Grace Period] ${t.description.substring(0, 40)}`)
        console.log(`  Done: ${t.dates.done}, DoneDate: ${doneDate.toISOString()}`)
        console.log(`  Hours ago: ${hoursAgo.toFixed(2)}, Within period: ${withinPeriod}`)

        return withinPeriod
      }

      // If no done date, filter out (old completed tasks)
      console.log(`[BACKEND Grace Period] Filtering out ${t.description.substring(0, 40)} (no done date)`)
      return false
    })

    console.log(`[BACKEND getTasks] After grace period filter: ${tasks.filter(t => t.status === 'completed').length} completed tasks remain`)
  }

  // Filter by tags
  if (filters.tags && filters.tags.length > 0) {
    tasks = tasks.filter(t => filters.tags!.some(tag => t.tags.includes(tag.toLowerCase())))
  }

  // Filter by section
  if (filters.section) {
    tasks = tasks.filter(t => t.section.toLowerCase() === filters.section!.toLowerCase())
  }

  // Filter by quadrant
  if (filters.quadrant) {
    tasks = tasks.filter(t => getQuadrant(t) === filters.quadrant)
  }

  // Return flat list or tree (top-level only)
  if (filters.flat) {
    return tasks
  }

  // Return only top-level tasks (children are accessible via .children)
  return tasks.filter(t => !t.parentId)
}

/**
 * Get Eisenhower matrix grouping
 */
export async function getEisenhowerMatrix(includeCompleted = false): Promise<EisenhowerMatrix> {
  const tasks = await getTasks({ includeCompleted, flat: true })

  const matrix: EisenhowerMatrix = {
    Q1: [],
    Q2: [],
    Q3: [],
    Q4: []
  }

  for (const task of tasks) {
    const quadrant = getQuadrant(task)
    matrix[quadrant].push(task)
  }

  return matrix
}

/**
 * Get all sections
 */
export async function getSections(): Promise<string[]> {
  const parsed = await readTasksFile()
  return parsed.sections
}

/**
 * Check if tasks.md exists
 */
export function tasksFileExists(): boolean {
  return fsSync.existsSync(TASKS_FILE)
}
