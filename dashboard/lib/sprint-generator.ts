/**
 * Sprint Generator Module
 *
 * Generates sprint summary views from tasks.md data.
 * Focuses on NOW section + in-progress tasks for current sprint visibility.
 */

import { getTasks, getEisenhowerMatrix, getSections } from './task-parser'
import type { Task } from './task-parser'

// ============================================================================
// Types
// ============================================================================

export interface SprintStats {
  totalInSprint: number
  inProgress: number
  pending: number
  blocked: number
  completed: number
  overdue: number
  dueThisWeek: number
  urgent: number
  important: number
}

export interface SprintTask extends Task {
  daysUntilDue?: number
  isOverdue?: boolean
}

export interface SprintSummary {
  generatedAt: string
  stats: SprintStats
  currentFocus: SprintTask | null
  nowTasks: SprintTask[]
  upNext: SprintTask[]
  blockedTasks: SprintTask[]
  recentlyCompleted: SprintTask[]
  overdueTasks: SprintTask[]
  sections: string[]
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate days until due date
 */
function getDaysUntilDue(dueDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  return Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Check if date is within this week
 */
function isDueThisWeek(dueDate: string): boolean {
  const days = getDaysUntilDue(dueDate)
  return days >= 0 && days <= 7
}

/**
 * Enrich task with due date calculations
 */
function enrichTask(task: Task): SprintTask {
  const enriched: SprintTask = { ...task }

  if (task.dates.due) {
    enriched.daysUntilDue = getDaysUntilDue(task.dates.due)
    enriched.isOverdue = enriched.daysUntilDue < 0 &&
      task.status !== 'completed' &&
      task.status !== 'cancelled'
  }

  return enriched
}

/**
 * Sort tasks by priority (urgent+important first, then by due date)
 */
function sortByPriority(tasks: SprintTask[]): SprintTask[] {
  return [...tasks].sort((a, b) => {
    // Q1 (urgent + important) first
    if (a.isUrgent && a.isImportant && !(b.isUrgent && b.isImportant)) return -1
    if (!(a.isUrgent && a.isImportant) && b.isUrgent && b.isImportant) return 1

    // Then urgent
    if (a.isUrgent && !b.isUrgent) return -1
    if (!a.isUrgent && b.isUrgent) return 1

    // Then important
    if (a.isImportant && !b.isImportant) return -1
    if (!a.isImportant && b.isImportant) return 1

    // Then by due date (earlier first)
    if (a.dates.due && !b.dates.due) return -1
    if (!a.dates.due && b.dates.due) return 1
    if (a.dates.due && b.dates.due) {
      return a.dates.due.localeCompare(b.dates.due)
    }

    // Finally by line number (order in file)
    return a.lineNumber - b.lineNumber
  })
}

// ============================================================================
// Main Generator Function
// ============================================================================

/**
 * Generate sprint summary from tasks.md
 */
export async function generateSprintSummary(): Promise<SprintSummary> {
  // Get all tasks (including completed for recent completions)
  const allTasks = await getTasks({ flat: true, includeCompleted: true })
  const sections = await getSections()

  // Enrich all tasks with due date calculations
  const enrichedTasks = allTasks.map(enrichTask)

  // Filter to NOW section tasks
  const nowSectionTasks = enrichedTasks.filter(t =>
    t.section.toUpperCase() === 'NOW'
  )

  // Active tasks (not completed/cancelled)
  const activeTasks = enrichedTasks.filter(t =>
    t.status !== 'completed' && t.status !== 'cancelled'
  )

  // Get specific task groups
  const currentFocus = enrichedTasks.find(t => t.status === 'in_progress') || null

  const pendingNowTasks = nowSectionTasks.filter(t =>
    t.status === 'pending' || t.status === 'in_progress'
  )

  const blockedTasks = activeTasks.filter(t => t.status === 'blocked')

  const overdueTasks = activeTasks.filter(t => t.isOverdue)

  // Recently completed (within last 7 days)
  const recentlyCompleted = enrichedTasks.filter(t => {
    if (t.status !== 'completed' || !t.dates.done) return false
    const doneDate = new Date(t.dates.done)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return doneDate >= weekAgo
  }).slice(0, 5)

  // Up next: pending tasks from NOW section, sorted by priority
  const upNext = sortByPriority(
    pendingNowTasks.filter(t => t.status === 'pending')
  ).slice(0, 5)

  // Calculate stats
  const stats: SprintStats = {
    totalInSprint: nowSectionTasks.filter(t =>
      t.status !== 'completed' && t.status !== 'cancelled'
    ).length,
    inProgress: activeTasks.filter(t => t.status === 'in_progress').length,
    pending: activeTasks.filter(t => t.status === 'pending').length,
    blocked: blockedTasks.length,
    completed: enrichedTasks.filter(t => t.status === 'completed').length,
    overdue: overdueTasks.length,
    dueThisWeek: activeTasks.filter(t =>
      t.dates.due && isDueThisWeek(t.dates.due)
    ).length,
    urgent: activeTasks.filter(t => t.isUrgent).length,
    important: activeTasks.filter(t => t.isImportant).length
  }

  return {
    generatedAt: new Date().toISOString(),
    stats,
    currentFocus,
    nowTasks: sortByPriority(pendingNowTasks),
    upNext,
    blockedTasks: blockedTasks.slice(0, 5),
    recentlyCompleted,
    overdueTasks: overdueTasks.slice(0, 5),
    sections
  }
}
