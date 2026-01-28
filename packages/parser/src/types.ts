/**
 * Type definitions for tasks-ng parser
 * Based on SPEC.md v2.0.0
 */

/**
 * Checkbox state markers from SPEC.md
 */
export type CheckboxState = ' ' | '/' | 'x' | '-' | '>' | '?'

/**
 * Semantic task status derived from checkbox state
 */
export type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'deferred'
  | 'blocked'

/**
 * Date metadata for a task
 */
export interface TaskDates {
  /** Due date in YYYY-MM-DD format */
  due?: string
  /** Completion date in YYYY-MM-DD format */
  done?: string
  /** Creation date in YYYY-MM-DD format */
  created?: string
}

/**
 * A parsed task from tasks.md
 */
export interface Task {
  /** Unique identifier: L{lineNumber}_{contentHash} */
  id: string
  /** 1-indexed line number in source file */
  lineNumber: number
  /** Task description text (metadata tokens removed) */
  description: string
  /** Original raw line from source */
  rawLine: string
  /** Checkbox state marker */
  checkboxState: CheckboxState
  /** Semantic status derived from checkbox */
  status: TaskStatus
  /** Nesting level (0-3, based on 4-space indentation) */
  level: number
  /** Parent task ID if nested */
  parentId?: string
  /** Child tasks */
  children: Task[]
  /** Tags (#tag) */
  tags: string[]
  /** Mentions (@mention) */
  mentions: string[]
  /** Modifiers (+modifier or +modifier:value) */
  modifiers: string[]
  /** Date metadata */
  dates: TaskDates
  /** Time spent in minutes (_spent:N) */
  timeSpent?: number
  /** Has +urgent modifier */
  isUrgent: boolean
  /** Has +important modifier */
  isImportant: boolean
  /** Section name (from ## or ### headers) */
  section: string
}

/**
 * Eisenhower matrix quadrant
 */
export type EisenhowerQuadrant = 'Q1' | 'Q2' | 'Q3' | 'Q4'

/**
 * Eisenhower matrix grouping
 */
export interface EisenhowerMatrix {
  /** Urgent + Important: Do first */
  Q1: Task[]
  /** Important only: Schedule */
  Q2: Task[]
  /** Urgent only: Delegate */
  Q3: Task[]
  /** Neither: Consider dropping */
  Q4: Task[]
}

/**
 * Result of parsing a tasks.md file
 */
export interface ParsedFile {
  /** All parsed tasks (flat list, with parent-child relationships) */
  tasks: Task[]
  /** All section names found */
  sections: string[]
  /** Original raw content */
  rawContent: string
  /** Original lines array */
  lines: string[]
}

/**
 * Options for building a task line
 */
export interface BuildTaskLineOptions {
  description: string
  checkboxState?: CheckboxState
  level?: number
  tags?: string[]
  mentions?: string[]
  modifiers?: string[]
  dates?: TaskDates
  timeSpent?: number
}
