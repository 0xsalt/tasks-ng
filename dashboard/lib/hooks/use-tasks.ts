"use client"

import { useState, useEffect, useCallback } from 'react'

// Types matching task-parser.ts
export type CheckboxState = ' ' | '/' | 'x' | '-' | '>' | '?'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'deferred' | 'blocked'

export interface Task {
  id: string
  lineNumber: number
  description: string
  rawLine: string
  checkboxState: CheckboxState
  status: TaskStatus
  level: number
  parentId?: string
  children: Task[]
  tags: string[]
  mentions: string[]
  modifiers: string[]
  dates: {
    due?: string
    done?: string
    created?: string
  }
  timeSpent?: number
  isUrgent: boolean
  isImportant: boolean
  section: string
}

export interface EisenhowerMatrix {
  Q1: Task[]
  Q2: Task[]
  Q3: Task[]
  Q4: Task[]
}

export interface TasksResponse {
  tasks: Task[]
  count: number
  filters: Record<string, unknown>
}

export interface EisenhowerResponse {
  matrix: EisenhowerMatrix
  counts: {
    Q1: number
    Q2: number
    Q3: number
    Q4: number
    total: number
  }
  labels: {
    Q1: string
    Q2: string
    Q3: string
    Q4: string
  }
}

export interface SectionsResponse {
  sections: string[]
  count: number
}

export interface UseTasksResult {
  tasks: Task[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export interface UseEisenhowerResult {
  matrix: EisenhowerMatrix | null
  counts: EisenhowerResponse['counts'] | null
  labels: EisenhowerResponse['labels'] | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export interface UseSectionsResult {
  sections: string[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Hook to fetch tasks with optional filters
 */
export function useTasks(filters?: {
  status?: string
  tags?: string
  section?: string
  includeCompleted?: boolean
  flat?: boolean
}): UseTasksResult {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filters?.status) params.set('status', filters.status)
      if (filters?.tags) params.set('tags', filters.tags)
      if (filters?.section) params.set('section', filters.section)
      if (filters?.includeCompleted) params.set('includeCompleted', 'true')
      if (filters?.flat) params.set('flat', 'true')

      const url = `/api/tasks${params.toString() ? `?${params}` : ''}`
      const res = await fetch(url)

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to fetch tasks')
      }

      const data: TasksResponse = await res.json()
      console.log(`[useTasks] Fetched ${data.tasks.length} tasks from API`)
      console.log(`[useTasks] Completed tasks in response:`, data.tasks.filter(t => t.status === 'completed').map(t => ({
        desc: t.description.substring(0, 40),
        done: t.dates.done
      })))
      setTasks(data.tasks)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setTasks([])
    } finally {
      setIsLoading(false)
    }
  }, [filters?.status, filters?.tags, filters?.section, filters?.includeCompleted, filters?.flat])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  return { tasks, isLoading, error, refetch: fetchTasks }
}

/**
 * Hook to fetch Eisenhower matrix data
 */
export function useEisenhower(includeCompleted = false): UseEisenhowerResult {
  const [matrix, setMatrix] = useState<EisenhowerMatrix | null>(null)
  const [counts, setCounts] = useState<EisenhowerResponse['counts'] | null>(null)
  const [labels, setLabels] = useState<EisenhowerResponse['labels'] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMatrix = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const url = `/api/tasks/eisenhower${includeCompleted ? '?includeCompleted=true' : ''}`
      const res = await fetch(url)

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to fetch Eisenhower matrix')
      }

      const data: EisenhowerResponse = await res.json()
      setMatrix(data.matrix)
      setCounts(data.counts)
      setLabels(data.labels)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setMatrix(null)
      setCounts(null)
      setLabels(null)
    } finally {
      setIsLoading(false)
    }
  }, [includeCompleted])

  useEffect(() => {
    fetchMatrix()
  }, [fetchMatrix])

  return { matrix, counts, labels, isLoading, error, refetch: fetchMatrix }
}

/**
 * Hook to fetch sections
 */
export function useSections(): UseSectionsResult {
  const [sections, setSections] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSections = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/tasks/sections')

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to fetch sections')
      }

      const data: SectionsResponse = await res.json()
      setSections(data.sections)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setSections([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSections()
  }, [fetchSections])

  return { sections, isLoading, error, refetch: fetchSections }
}

/**
 * Compute task statistics from task list
 */
export function computeTaskStats(tasks: Task[]) {
  const byStatus = {
    pending: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
    deferred: 0,
    blocked: 0
  }

  const bySection: Record<string, number> = {}

  for (const task of tasks) {
    byStatus[task.status]++

    bySection[task.section] = (bySection[task.section] ?? 0) + 1
  }

  return {
    total: tasks.length,
    byStatus,
    bySection,
    active: byStatus.pending + byStatus.in_progress + byStatus.blocked + byStatus.deferred,
    inProgress: tasks.find(t => t.status === 'in_progress'),
    urgent: tasks.filter(t => t.isUrgent).length,
    important: tasks.filter(t => t.isImportant).length
  }
}
