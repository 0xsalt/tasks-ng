/**
 * Eisenhower Matrix helpers
 * Categorize tasks by urgency and importance
 */

import type { Task, EisenhowerQuadrant, EisenhowerMatrix } from './types.js'

/**
 * Get Eisenhower quadrant for a task
 *
 * Q1: Urgent + Important (Do First)
 * Q2: Important only (Schedule)
 * Q3: Urgent only (Delegate)
 * Q4: Neither (Consider dropping)
 */
export function getQuadrant(task: Task): EisenhowerQuadrant {
  if (task.isUrgent && task.isImportant) return 'Q1'
  if (task.isImportant) return 'Q2'
  if (task.isUrgent) return 'Q3'
  return 'Q4'
}

/**
 * Group tasks into Eisenhower matrix
 */
export function groupByQuadrant(tasks: Task[]): EisenhowerMatrix {
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
 * Filter tasks by quadrant
 */
export function filterByQuadrant(tasks: Task[], quadrant: EisenhowerQuadrant): Task[] {
  return tasks.filter(t => getQuadrant(t) === quadrant)
}

/**
 * Get quadrant display info
 */
export function getQuadrantInfo(quadrant: EisenhowerQuadrant): {
  name: string
  action: string
  description: string
} {
  switch (quadrant) {
    case 'Q1':
      return {
        name: 'Do First',
        action: 'Do',
        description: 'Urgent and Important - Crisis, deadlines, problems'
      }
    case 'Q2':
      return {
        name: 'Schedule',
        action: 'Schedule',
        description: 'Important but not Urgent - Planning, prevention, improvement'
      }
    case 'Q3':
      return {
        name: 'Delegate',
        action: 'Delegate',
        description: 'Urgent but not Important - Interruptions, some meetings'
      }
    case 'Q4':
      return {
        name: 'Eliminate',
        action: 'Skip',
        description: 'Neither Urgent nor Important - Time wasters, busy work'
      }
  }
}

/**
 * Sort tasks by Eisenhower priority (Q1 first, Q4 last)
 */
export function sortByEisenhower(tasks: Task[]): Task[] {
  const priority: Record<EisenhowerQuadrant, number> = {
    Q1: 0,
    Q2: 1,
    Q3: 2,
    Q4: 3
  }

  return [...tasks].sort((a, b) => {
    return priority[getQuadrant(a)] - priority[getQuadrant(b)]
  })
}
