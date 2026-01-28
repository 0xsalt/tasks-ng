/**
 * Core parsing functions for tasks.md format
 * Pure functions - no side effects, no dependencies
 */

import type { Task, CheckboxState, ParsedFile } from './types.js'
import {
  CHECKBOX_REGEX,
  SECTION_H2_REGEX,
  SECTION_H3_REGEX,
  checkboxToStatus,
  generateTaskId,
  extractTags,
  extractMentions,
  extractModifiers,
  extractDates,
  extractTimeSpent,
  extractDescription,
  getIndentLevel
} from './extractors.js'

/**
 * Parse a single line into a Task object
 * Returns null if line is not a valid task
 */
export function parseLine(line: string, lineNumber: number, section: string): Task | null {
  const checkboxMatch = line.match(CHECKBOX_REGEX)
  if (!checkboxMatch) return null

  const checkboxState = checkboxMatch[2] as CheckboxState
  const level = getIndentLevel(line)

  // Validate max nesting depth per SPEC.md
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
 * Build parent-child relationships based on indentation
 * Mutates tasks in place to set parentId and children
 */
export function buildTaskTree(tasks: Task[]): void {
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

/**
 * Parse entire tasks.md content into structured data
 *
 * @param content - Raw markdown content of tasks.md file
 * @returns ParsedFile with tasks, sections, and original content
 *
 * @example
 * ```ts
 * const content = fs.readFileSync('tasks.md', 'utf-8')
 * const { tasks, sections } = parseTasksFile(content)
 * ```
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

    // Track sections (## and ### headers)
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
 * Get only top-level tasks (no parent)
 */
export function getTopLevelTasks(tasks: Task[]): Task[] {
  return tasks.filter(t => !t.parentId)
}

/**
 * Filter tasks by status
 */
export function filterByStatus(tasks: Task[], statuses: Task['status'][]): Task[] {
  return tasks.filter(t => statuses.includes(t.status))
}

/**
 * Filter tasks by tags (any match)
 */
export function filterByTags(tasks: Task[], tags: string[]): Task[] {
  const lowerTags = tags.map(t => t.toLowerCase())
  return tasks.filter(t => t.tags.some(tag => lowerTags.includes(tag)))
}

/**
 * Filter tasks by section
 */
export function filterBySection(tasks: Task[], section: string): Task[] {
  const lowerSection = section.toLowerCase()
  return tasks.filter(t => t.section.toLowerCase() === lowerSection)
}

/**
 * Get active tasks (not completed or cancelled)
 */
export function getActiveTasks(tasks: Task[]): Task[] {
  return tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled')
}
