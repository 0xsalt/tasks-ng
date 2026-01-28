/**
 * Task Parser Module for tasks-ng Dashboard
 *
 * This module re-exports the pure parser from @tasks-ng/parser
 * and adds file operations (Layer 2 functionality).
 *
 * Based on SPEC.md v2.0.0
 */

import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'
import os from 'os'
import crypto from 'crypto'
import { withLock } from './file-lock'

// Re-export everything from the pure parser package
export {
  // Types
  type CheckboxState,
  type TaskStatus,
  type TaskDates,
  type Task,
  type EisenhowerQuadrant,
  type EisenhowerMatrix,
  type ParsedFile,
  type BuildTaskLineOptions,

  // Parser functions
  parseTasksFile,
  parseLine,
  buildTaskTree,
  getTopLevelTasks,
  filterByStatus,
  filterByTags,
  filterBySection,
  getActiveTasks,

  // Builder functions
  buildTaskLine,
  taskToLine,
  updateTaskLine,
  replaceTaskLine,
  insertLine,
  deleteLine,
  deleteLines,

  // Extractors
  checkboxToStatus,
  statusToCheckbox,
  generateTaskId,
  simpleHash,
  extractTags,
  extractMentions,
  extractModifiers,
  extractDates,
  extractTimeSpent,
  extractDescription,
  getIndentLevel,
  isTaskLine,
  extractCheckboxState,
  CHECKBOX_REGEX,
  TAG_REGEX,
  MENTION_REGEX,
  MODIFIER_REGEX,
  DATE_REGEX,
  TIME_SPENT_REGEX,
  SECTION_H2_REGEX,
  SECTION_H3_REGEX,

  // Eisenhower
  getQuadrant,
  groupByQuadrant,
  filterByQuadrant,
  getQuadrantInfo,
  sortByEisenhower
} from '@tasks-ng/parser'

// Import types we need for file operations
import type {
  Task,
  TaskStatus,
  CheckboxState,
  TaskDates,
  ParsedFile
} from '@tasks-ng/parser'

import {
  parseTasksFile,
  buildTaskLine,
  statusToCheckbox,
  CHECKBOX_REGEX,
  SECTION_H2_REGEX,
  SECTION_H3_REGEX
} from '@tasks-ng/parser'

// ============================================================================
// File Location Configuration (Layer 2)
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

// ============================================================================
// File Operations (Layer 2)
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
 * Check if tasks.md exists
 */
export function tasksFileExists(): boolean {
  return fsSync.existsSync(TASKS_FILE)
}

// ============================================================================
// CRUD Operations (Layer 2)
// ============================================================================

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

/**
 * Find the line number to insert a new task in a section
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
  const taskLine = buildTaskLine({
    description: input.description,
    checkboxState,
    level,
    tags: input.tags || [],
    mentions: input.mentions || [],
    modifiers,
    dates: { due: input.due },
    timeSpent: input.timeSpent
  })

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
    created: task.dates.created
  }
  const timeSpent = input.timeSpent ?? task.timeSpent

  // Validation: If completing, require done date
  if (checkboxState === 'x' && !dates.done) {
    dates.done = new Date().toISOString().split('T')[0]
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

  // Validation: Only one task in progress at a time
  if (checkboxState === '/' && task.checkboxState !== '/') {
    const existingInProgress = parsed.tasks.find(
      t => t.id !== taskId && t.checkboxState === '/'
    )
    if (existingInProgress) {
      throw new Error(
        `Cannot start task: another task is already in progress (${existingInProgress.id})`
      )
    }
  }

  // Build new line
  const newLine = buildTaskLine({
    description,
    checkboxState,
    level: task.level,
    tags,
    mentions,
    modifiers,
    dates,
    timeSpent
  })

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
  quadrant?: 'Q1' | 'Q2' | 'Q3' | 'Q4'
  includeCompleted?: boolean
  flat?: boolean
}

export async function getTasks(filters: TaskFilters = {}): Promise<Task[]> {
  const parsed = await readTasksFile()
  let tasks = parsed.tasks

  // Import filter helpers from the parser
  const { getQuadrant } = await import('@tasks-ng/parser')

  // Filter by status
  if (filters.status && filters.status.length > 0) {
    tasks = tasks.filter(t => filters.status!.includes(t.status))
  } else if (!filters.includeCompleted) {
    // Default: exclude completed and cancelled
    tasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled')
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
export async function getEisenhowerMatrix(includeCompleted = false): Promise<{
  Q1: Task[]
  Q2: Task[]
  Q3: Task[]
  Q4: Task[]
}> {
  const tasks = await getTasks({ includeCompleted, flat: true })
  const { groupByQuadrant } = await import('@tasks-ng/parser')
  return groupByQuadrant(tasks)
}

/**
 * Get all sections
 */
export async function getSections(): Promise<string[]> {
  const parsed = await readTasksFile()
  return parsed.sections
}
