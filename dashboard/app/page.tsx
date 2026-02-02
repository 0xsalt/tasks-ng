"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  CheckSquare,
  Layers,
  Hash,
  AtSign,
  Plus,
  Calendar,
  AlertCircle,
  Clock,
  Target,
  Zap,
  Loader2
} from "lucide-react"
import { useTasks, useEisenhower, computeTaskStats, type Task, type EisenhowerMatrix } from "@/lib/hooks/use-tasks"
import { useState, useEffect, useCallback, useMemo } from "react"

type TagFilter = 'work' | 'pers'
type QuadrantFilter = 'Q1' | 'Q2' | 'Q3' | 'Q4'

// Grace period for completed/cancelled tasks to remain visible (hours)
const GRACE_PERIOD_HOURS = 12

function TaskStatusBadge({ status }: { status: Task['status'] }) {
  const variants: Record<Task['status'], { variant: "default" | "secondary" | "destructive" | "success" | "primary" | "warning", label: string }> = {
    pending: { variant: "secondary", label: "Pending" },
    in_progress: { variant: "primary", label: "In Progress" },
    completed: { variant: "success", label: "Done" },
    cancelled: { variant: "default", label: "Cancelled" },
    deferred: { variant: "warning", label: "Deferred" },
    blocked: { variant: "destructive", label: "Blocked" }
  }
  const { variant, label } = variants[status]
  return <Badge variant={variant}>{label}</Badge>
}

function CheckboxIcon({
  state,
  taskId,
  onUpdate,
  task
}: {
  state: Task['checkboxState']
  taskId: string
  onUpdate: () => void
  task: Task
}) {
  const [optimisticState, setOptimisticState] = useState<Task['checkboxState'] | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  // Use optimistic state if available, otherwise use prop state
  const displayState = optimisticState ?? state

  // Check if task is in grace period
  const inGracePeriod = task.status === 'completed' && task.dates.done ? (() => {
    const now = new Date()
    const doneDate = new Date(task.dates.done)
    const hoursAgo = (now.getTime() - doneDate.getTime()) / (1000 * 60 * 60)
    return hoursAgo < 12
  })() : false

  const icons: Record<Task['checkboxState'], { icon: string, color: string }> = {
    ' ': { icon: '[ ]', color: 'text-gray-400' },
    '/': { icon: '[/]', color: 'text-blue-500' },
    'x': { icon: inGracePeriod ? '[x]⏱' : '[x]', color: inGracePeriod ? 'text-green-400 font-bold' : 'text-green-500' },
    '-': { icon: '[-]', color: 'text-gray-500' },
    '>': { icon: '[>]', color: 'text-yellow-500' },
    '?': { icon: '[?]', color: 'text-red-500' }
  }

  const cycleState = (current: Task['checkboxState']): Task['checkboxState'] => {
    // 4-state cycle: [ ] → [/] → [x] → [-] → [ ]
    if (current === ' ') return '/'  // pending → in-progress
    if (current === '/') return 'x'  // in-progress → completed
    if (current === 'x') return '-'  // completed → cancelled
    if (current === '-') return ' '  // cancelled → pending
    // For other states (deferred, blocked), return to pending
    return ' '
  }

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent parent click handlers
    if (isUpdating) return // Prevent double-clicks

    const nextState = cycleState(displayState)

    // OPTIMISTIC UPDATE: Show change immediately
    setOptimisticState(nextState)
    setIsUpdating(true)

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkboxState: nextState })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update task')
      }

      // Trigger refetch after successful update
      onUpdate()

      // Clear optimistic state after a short delay to let refetch complete
      setTimeout(() => setOptimisticState(null), 500)
    } catch (error) {
      console.error('Error updating checkbox state:', error)
      // REVERT: On error, revert to original state
      setOptimisticState(null)
      alert('Failed to update task. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  const { icon, color } = icons[displayState]

  return (
    <button
      onClick={handleClick}
      disabled={isUpdating}
      className={`font-mono text-sm whitespace-nowrap shrink-0 ${color} ${
        isUpdating ? 'opacity-70' : 'cursor-pointer hover:scale-110 active:scale-95'
      } transition-all touch-manipulation`}
      title="Click to cycle state"
    >
      {icon}
    </button>
  )
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-[#1a759f]" />
    </div>
  )
}

function ErrorDisplay({ message }: { message: string }) {
  return (
    <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span>{message}</span>
        </div>
        <p className="text-sm text-red-500 dark:text-red-400 mt-2">
          Make sure ~/.local/share/tasks-ng/tasks.md exists and the server is running.
        </p>
      </CardContent>
    </Card>
  )
}

// Tag filter toggle button
function TagFilterButton({
  tag,
  active,
  onClick
}: {
  tag: TagFilter
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
        active
          ? 'bg-[#1a759f] dark:bg-[#38bdf8] text-white border-[#1a759f] dark:border-[#38bdf8]'
          : 'bg-white/80 dark:bg-gray-700/80 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-[#1a759f] dark:hover:border-[#38bdf8] hover:text-[#1a759f] dark:hover:text-[#38bdf8]'
      }`}
    >
      #{tag}
    </button>
  )
}

// Eisenhower quadrant button
function QuadrantButton({
  quadrant,
  label,
  count,
  active,
  onClick,
  colorClass
}: {
  quadrant: QuadrantFilter
  label: string
  count: number
  active: boolean
  onClick: () => void
  colorClass: { bg: string, text: string, border: string, activeBg: string, darkBg: string, darkText: string, darkBorder: string, darkActiveBg: string }
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
        active
          ? `${colorClass.activeBg} dark:${colorClass.darkActiveBg} ${colorClass.text} dark:${colorClass.darkText} ${colorClass.border} dark:${colorClass.darkBorder} ring-2 ring-offset-1 dark:ring-offset-gray-900`
          : `${colorClass.bg} dark:${colorClass.darkBg} ${colorClass.text} dark:${colorClass.darkText} ${colorClass.border} dark:${colorClass.darkBorder} hover:ring-1 hover:ring-offset-1 dark:hover:ring-offset-gray-900`
      }`}
    >
      <span>{label}</span>
      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${active ? 'bg-white/30 dark:bg-black/20' : 'bg-white/50 dark:bg-black/20'}`}>
        {count}
      </span>
    </button>
  )
}

// Get status prefix indicator for task
function getStatusPrefix(task: Task): string {
  if (task.status === 'completed') return '✓ '
  if (task.status === 'in_progress') return '→ '
  return ''
}

export default function OverviewPage() {
  const { tasks, isLoading: tasksLoading, error: tasksError, refetch: refetchTasks } = useTasks({ flat: true })
  const { matrix, counts: eisenhowerCounts, isLoading: eisenhowerLoading, error: eisenhowerError, refetch: refetchMatrix } = useEisenhower()

  // Filter state
  const [tagFilters, setTagFilters] = useState<Set<TagFilter>>(new Set())
  const [quadrantFilters, setQuadrantFilters] = useState<Set<QuadrantFilter>>(new Set())
  const [statusFilter, setStatusFilter] = useState<Task['status'] | null>(null)
  const [isTodayCollapsed, setIsTodayCollapsed] = useState(true)

  // Toggle tag filter
  const toggleTag = useCallback((tag: TagFilter) => {
    setTagFilters(prev => {
      const next = new Set(prev)
      if (next.has(tag)) {
        next.delete(tag)
      } else {
        next.add(tag)
      }
      return next
    })
  }, [])

  // Toggle quadrant filter
  const toggleQuadrant = useCallback((q: QuadrantFilter) => {
    setQuadrantFilters(prev => {
      const next = new Set(prev)
      if (next.has(q)) {
        next.delete(q)
      } else {
        next.add(q)
      }
      return next
    })
  }, [])

  // Listen for quick capture task creation
  const handleTaskCreated = useCallback(() => {
    refetchTasks()
    refetchMatrix()
  }, [refetchTasks, refetchMatrix])

  useEffect(() => {
    window.addEventListener('taskCreated', handleTaskCreated)
    return () => window.removeEventListener('taskCreated', handleTaskCreated)
  }, [handleTaskCreated])

  // Filter tasks by tags (intersection - must have ALL selected tags)
  const filterByTags = useCallback((taskList: Task[]): Task[] => {
    if (tagFilters.size === 0) return taskList
    return taskList.filter(task => {
      for (const tag of tagFilters) {
        if (!task.tags.includes(tag)) return false
      }
      return true
    })
  }, [tagFilters])

  // Get quadrant for a task
  const getQuadrant = useCallback((task: Task): QuadrantFilter => {
    if (task.isUrgent && task.isImportant) return 'Q1'
    if (task.isImportant) return 'Q2'
    if (task.isUrgent) return 'Q3'
    return 'Q4'
  }, [])

  // Filter tasks by quadrants (union - any selected quadrant)
  const filterByQuadrants = useCallback((taskList: Task[]): Task[] => {
    if (quadrantFilters.size === 0) return taskList
    return taskList.filter(task => quadrantFilters.has(getQuadrant(task)))
  }, [quadrantFilters, getQuadrant])

  // Filtered tasks (apply tag filter first)
  const tagFilteredTasks = useMemo(() => {
    return filterByTags(tasks)
  }, [filterByTags, tasks])

  // Compute stats on tag-filtered tasks
  const stats = useMemo(() => computeTaskStats(tagFilteredTasks), [tagFilteredTasks])

  // Eisenhower counts (on tag-filtered tasks)
  const filteredEisenhowerCounts = useMemo(() => {
    const now = new Date()
    const counts = { Q1: 0, Q2: 0, Q3: 0, Q4: 0, total: 0 }

    // Count tasks that are not completed/cancelled, or recently completed (grace period)
    const countableTasks = tagFilteredTasks.filter(t => {
      // Always count non-completed/non-cancelled tasks
      if (t.status !== 'completed' && t.status !== 'cancelled') return true

      // For completed/cancelled: check if done within grace period
      if (t.dates.done) {
        const doneDate = new Date(t.dates.done)
        const hoursAgo = (now.getTime() - doneDate.getTime()) / (1000 * 60 * 60)
        return hoursAgo < GRACE_PERIOD_HOURS
      }

      return false
    })

    for (const task of countableTasks) {
      const q = getQuadrant(task)
      counts[q]++
      counts.total++
    }
    return counts
  }, [tagFilteredTasks, getQuadrant])

  // Active tasks (not completed, not cancelled)
  // BUT keep completed/cancelled tasks visible for 12 hours (grace period for undo)
  const activeTasks = useMemo(() => {
    const now = new Date()

    return tagFilteredTasks.filter(t => {
      // Always show non-completed/non-cancelled tasks
      if (t.status !== 'completed' && t.status !== 'cancelled') return true

      // For completed/cancelled: check if done within grace period
      if (t.dates.done) {
        const doneDate = new Date(t.dates.done)
        const hoursAgo = (now.getTime() - doneDate.getTime()) / (1000 * 60 * 60)
        return hoursAgo < GRACE_PERIOD_HOURS
      }

      return false
    })
  }, [tagFilteredTasks])

  // In-progress tasks (for Current Focus)
  // Option A: Show any task that was in-progress within last 12 hours
  // Mental model: "What I worked on today while it's still today"
  const inProgressTasks = useMemo(() => {
    const now = new Date()

    return tagFilteredTasks.filter(t => {
      // Always show actual in-progress tasks
      if (t.status === 'in_progress') return true

      // Show ANY task that left in-progress recently (Option A: Full Grace Period)
      if (t.dates.last_in_progress) {
        const lastInProgressDate = new Date(t.dates.last_in_progress)
        const hoursAgo = (now.getTime() - lastInProgressDate.getTime()) / (1000 * 60 * 60)
        return hoursAgo < GRACE_PERIOD_HOURS
      }

      return false
    })
  }, [tagFilteredTasks])

  // Apply status filter if active
  const statusFilteredTasks = useMemo(() => {
    if (!statusFilter) return activeTasks
    return activeTasks.filter(t => t.status === statusFilter)
  }, [activeTasks, statusFilter])

  // Final filtered tasks for Active Tasks list (tag + quadrant filters)
  const displayedTasks = useMemo(() =>
    filterByQuadrants(statusFilteredTasks),
    [filterByQuadrants, statusFilteredTasks]
  )

  // Group tasks by Eisenhower quadrant for grid view
  const tasksByQuadrant = useMemo(() => {
    const grouped: Record<QuadrantFilter, Task[]> = { Q1: [], Q2: [], Q3: [], Q4: [] }
    for (const task of displayedTasks) {
      const q = getQuadrant(task)
      grouped[q].push(task)
    }
    return grouped
  }, [displayedTasks, getQuadrant])

  const isLoading = tasksLoading || eisenhowerLoading
  const error = tasksError || eisenhowerError

  // Quadrant button configs
  const quadrantConfigs: Array<{
    quadrant: QuadrantFilter
    label: string
    icon: typeof Target
    colorClass: { bg: string, text: string, border: string, activeBg: string, darkBg: string, darkText: string, darkBorder: string, darkActiveBg: string }
  }> = [
    {
      quadrant: 'Q1',
      label: 'Urgent',
      icon: Target,
      colorClass: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', activeBg: 'bg-red-100', darkBg: 'bg-red-900/30', darkText: 'text-red-400', darkBorder: 'border-red-800', darkActiveBg: 'bg-red-900/50' }
    },
    {
      quadrant: 'Q2',
      label: 'Important',
      icon: Calendar,
      colorClass: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', activeBg: 'bg-yellow-100', darkBg: 'bg-yellow-900/30', darkText: 'text-yellow-400', darkBorder: 'border-yellow-800', darkActiveBg: 'bg-yellow-900/50' }
    },
    {
      quadrant: 'Q3',
      label: 'Quick Wins',
      icon: Zap,
      colorClass: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', activeBg: 'bg-orange-100', darkBg: 'bg-orange-900/30', darkText: 'text-orange-400', darkBorder: 'border-orange-800', darkActiveBg: 'bg-orange-900/50' }
    },
    {
      quadrant: 'Q4',
      label: 'Later',
      icon: Clock,
      colorClass: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', activeBg: 'bg-gray-100', darkBg: 'bg-gray-800', darkText: 'text-gray-400', darkBorder: 'border-gray-700', darkActiveBg: 'bg-gray-700' }
    }
  ]

  return (
    <div className="p-4 lg:p-8">
      {/* Hero Section with Tag Filters */}
      <div className="mb-6 lg:mb-8 rounded-2xl bg-gradient-to-br from-[#1a759f]/15 via-[#3b82f6]/10 to-[#1e6091]/15 dark:from-[#38bdf8]/20 dark:via-[#60a5fa]/15 dark:to-[#818cf8]/20 p-6 lg:p-8 border border-[#1a759f]/20 dark:border-[#38bdf8]/30">
        <div className="max-w-4xl">
          <h2 className="text-xs lg:text-sm font-semibold text-[#1a759f] dark:text-[#38bdf8] uppercase tracking-wide mb-1">
            Live Task Dashboard
          </h2>
          <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            tasks-ng
          </h1>
          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400 mb-4">
            Real-time view of ~/.local/share/tasks-ng/tasks.md
          </p>

          {/* Active Tasks Count + Tag Filters (side by side) */}
          <div className="flex items-center gap-4 flex-wrap">
            {isLoading ? (
              <div className="inline-flex items-center gap-2 bg-white dark:bg-[var(--card-bg)] rounded-lg px-4 py-3 shadow-md border dark:border-[var(--card-border)]">
                <Loader2 className="h-4 w-4 animate-spin text-[#1a759f] dark:text-[#38bdf8]" />
                <span className="text-gray-600 dark:text-gray-400">Loading...</span>
              </div>
            ) : error ? (
              <div className="inline-flex items-center gap-2 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-3 border border-red-200 dark:border-red-800">
                <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
                <span className="text-red-600 dark:text-red-400">Could not load tasks</span>
              </div>
            ) : (
              <div className="inline-block bg-white dark:bg-[var(--card-bg)] rounded-lg px-4 py-3 shadow-md border border-[#76c893]/30 dark:border-[#4ade80]/30">
                <p className="text-2xl font-bold text-[#76c893] dark:text-[#4ade80]">
                  {stats.active} Active Tasks
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {stats.total} total {tagFilters.size > 0 && `matching #${[...tagFilters].join(' #')}`}
                </p>
              </div>
            )}

            {/* Tag Filter Buttons - to the right of Active Tasks */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">Filter:</span>
              <TagFilterButton
                tag="work"
                active={tagFilters.has('work')}
                onClick={() => toggleTag('work')}
              />
              <TagFilterButton
                tag="pers"
                active={tagFilters.has('pers')}
                onClick={() => toggleTag('pers')}
              />
              {tagFilters.size > 0 && (
                <button
                  onClick={() => setTagFilters(new Set())}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
                >
                  clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && <ErrorDisplay message={error} />}

      {/* Eisenhower Quadrant Buttons - FIRST */}
      {!isLoading && !error && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-gray-100">Eisenhower</h2>
            {quadrantFilters.size > 0 && (
              <button
                onClick={() => setQuadrantFilters(new Set())}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
              >
                clear
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {quadrantConfigs.map(config => (
              <QuadrantButton
                key={config.quadrant}
                quadrant={config.quadrant}
                label={config.label}
                count={filteredEisenhowerCounts[config.quadrant]}
                active={quadrantFilters.has(config.quadrant)}
                onClick={() => toggleQuadrant(config.quadrant)}
                colorClass={config.colorClass}
              />
            ))}
          </div>
        </div>
      )}

      {/* Today Section - Collapseable */}
      {!isLoading && !error && (
        <div className="mb-6">
          {/* Full-width clickable Today bar */}
          <button
            onClick={() => setIsTodayCollapsed(!isTodayCollapsed)}
            className="w-full flex items-center justify-between gap-4 px-4 py-3 mb-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-[#1a759f] dark:text-[#38bdf8]" />
                <h2 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-gray-100">Today</h2>
                {inProgressTasks.length > 0 && (
                  <Badge variant="primary">{inProgressTasks.length}</Badge>
                )}
              </div>

              {/* Status Filter Buttons - inline with heading */}
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setStatusFilter(null)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 border transition-all text-xs ${
                    statusFilter === null
                      ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100'
                      : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                  <span>Total: {stats.total}</span>
                </button>
                <button
                  onClick={() => setStatusFilter(statusFilter === 'in_progress' ? null : 'in_progress')}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 border transition-all text-xs ${
                    statusFilter === 'in_progress'
                      ? 'bg-blue-500 dark:bg-blue-400 text-white border-blue-500 dark:border-blue-400'
                      : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                  }`}
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>In Progress: {stats.byStatus.in_progress}</span>
                </button>
                <button
                  onClick={() => setStatusFilter(statusFilter === 'blocked' ? null : 'blocked')}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 border transition-all text-xs ${
                    statusFilter === 'blocked'
                      ? 'bg-red-500 dark:bg-red-400 text-white border-red-500 dark:border-red-400'
                      : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-red-400 dark:hover:border-red-500'
                  }`}
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Blocked: {stats.byStatus.blocked}</span>
                </button>
              </div>
            </div>

            {/* Collapse indicator */}
            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              {!isTodayCollapsed && <span>Hide</span>}
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isTodayCollapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                )}
              </svg>
            </div>
          </button>

          {/* In-progress task list - collapseable */}
          {!isTodayCollapsed && (
            <>
              {inProgressTasks.length > 0 ? (
                <div className="space-y-2">
                  {inProgressTasks.map(task => (
                    <Card key={task.id} className="border-l-4 border-l-[#1a759f] dark:border-l-[#38bdf8] bg-gradient-to-r from-[#1a759f]/5 dark:from-[#38bdf8]/10 to-transparent">
                      <CardContent className="py-3 px-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <CheckboxIcon state={task.checkboxState} taskId={task.id} onUpdate={handleTaskCreated} task={task} />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                              {getStatusPrefix(task)}{task.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                              <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{task.section}</span>
                              {task.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="text-[#1a759f] dark:text-[#38bdf8]">#{tag}</span>
                              ))}
                              {task.dates.due && (
                                <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                                  <Calendar className="h-3 w-3" />
                                  {task.dates.due}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">No tasks currently in progress</p>
              )}
            </>
          )}
        </div>
      )}

      {/* Eisenhower 4-Quadrant Grid */}
      {!isLoading && !error && displayedTasks.length > 0 && (
        <div className="mb-6 lg:mb-8">
          <h2 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            Priority Matrix
            <Badge variant="secondary">{displayedTasks.length} tasks</Badge>
            {(quadrantFilters.size > 0 || statusFilter) && (
              <button
                onClick={() => {
                  setQuadrantFilters(new Set())
                  setStatusFilter(null)
                }}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline ml-2"
              >
                clear all filters
              </button>
            )}
          </h2>

          {/* 2x2 Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quadrantConfigs.map(config => {
              const quadrantTasks = tasksByQuadrant[config.quadrant]
              // Build quadrant-specific classes for dark mode
              const cardBorderClass = config.quadrant === 'Q1' ? 'border-red-200 dark:border-red-800' :
                config.quadrant === 'Q2' ? 'border-yellow-200 dark:border-yellow-800' :
                config.quadrant === 'Q3' ? 'border-orange-200 dark:border-orange-800' :
                'border-gray-200 dark:border-gray-700'
              const headerBgClass = config.quadrant === 'Q1' ? 'bg-red-50 dark-q1-header' :
                config.quadrant === 'Q2' ? 'bg-yellow-50 dark-q2-header' :
                config.quadrant === 'Q3' ? 'bg-orange-50 dark-q3-header' :
                'bg-gray-50 dark-q4-header'
              const titleTextClass = config.quadrant === 'Q1' ? 'text-red-700 dark:text-red-400' :
                config.quadrant === 'Q2' ? 'text-yellow-700 dark:text-yellow-400' :
                config.quadrant === 'Q3' ? 'text-orange-700 dark:text-orange-400' :
                'text-gray-600 dark:text-gray-400'
              return (
                <Card key={config.quadrant} className={`border-2 ${cardBorderClass}`}>
                  <CardHeader className={`${headerBgClass} border-b ${cardBorderClass} pb-3`}>
                    <CardTitle className={`text-base flex items-center justify-between ${titleTextClass}`}>
                      <div className="flex items-center gap-2">
                        <config.icon className="h-4 w-4" />
                        <span>{config.label}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {quadrantTasks.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3">
                    {quadrantTasks.length > 0 ? (
                      <div className="space-y-1">
                        {quadrantTasks.slice(0, 10).map(task => (
                          <div
                            key={task.id}
                            className="flex items-start gap-2 px-[1px] py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            <CheckboxIcon state={task.checkboxState} taskId={task.id} onUpdate={handleTaskCreated} task={task} />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-normal text-gray-900 dark:text-gray-100 line-clamp-2 leading-relaxed break-words">
                                {getStatusPrefix(task)}{task.description}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                                <span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-[10px]">{task.section}</span>
                                {task.tags.slice(0, 2).map(tag => (
                                  <span key={tag} className="text-[#1a759f] dark:text-[#38bdf8]">#{tag}</span>
                                ))}
                                {task.dates.due && (
                                  <span className="text-orange-600 dark:text-orange-400 flex items-center gap-0.5">
                                    <Calendar className="h-2.5 w-2.5" />
                                    {task.dates.due}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {quadrantTasks.length > 10 && (
                          <p className="text-center text-xs text-gray-500 dark:text-gray-400 pt-1">
                            + {quadrantTasks.length - 10} more
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 dark:text-gray-500 italic text-center py-4">No tasks in this quadrant</p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state when filters exclude everything */}
      {!isLoading && !error && displayedTasks.length === 0 && activeTasks.length > 0 && (
        <div className="mb-6">
          <Card className="border-dashed dark:border-gray-600">
            <CardContent className="py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No tasks match the selected filters</p>
              <button
                onClick={() => {
                  setTagFilters(new Set())
                  setQuadrantFilters(new Set())
                }}
                className="mt-2 text-sm text-[#1a759f] dark:text-[#38bdf8] hover:underline"
              >
                Clear all filters
              </button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Format Reference - hidden on mobile */}
      <div className="hidden lg:block mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Format Reference</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Checkbox States */}
          <Card className="hover:shadow-lg dark:hover:shadow-gray-900/50 transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-gray-900 dark:text-gray-100">
                <CheckSquare className="h-4 w-4 text-[#1a759f] dark:text-[#38bdf8]" />
                Checkbox States
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-gray-400 dark:text-gray-500">[ ]</span>
                  <span className="text-gray-600 dark:text-gray-400">Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-blue-500 dark:text-blue-400">[/]</span>
                  <span className="text-gray-600 dark:text-gray-400">In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-green-500 dark:text-green-400">[x]</span>
                  <span className="text-gray-600 dark:text-gray-400">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-gray-500 dark:text-gray-400">[-]</span>
                  <span className="text-gray-600 dark:text-gray-400">Cancelled</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-yellow-500 dark:text-yellow-400">[&gt;]</span>
                  <span className="text-gray-600 dark:text-gray-400">Deferred</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-red-500 dark:text-red-400">[?]</span>
                  <span className="text-gray-600 dark:text-gray-400">Blocked</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metadata Prefixes */}
          <Card className="hover:shadow-lg dark:hover:shadow-gray-900/50 transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-gray-900 dark:text-gray-100">
                <Hash className="h-4 w-4 text-[#1e6091] dark:text-[#60a5fa]" />
                Metadata Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Hash className="h-3 w-3 text-[#1a759f] dark:text-[#38bdf8]" />
                  <span className="text-gray-600 dark:text-gray-300 font-mono">#tags</span>
                  <span className="text-gray-400 dark:text-gray-500">- categorization</span>
                </div>
                <div className="flex items-center gap-2">
                  <AtSign className="h-3 w-3 text-[#1a759f] dark:text-[#38bdf8]" />
                  <span className="text-gray-600 dark:text-gray-300 font-mono">@mentions</span>
                  <span className="text-gray-400 dark:text-gray-500">- assignment</span>
                </div>
                <div className="flex items-center gap-2">
                  <Plus className="h-3 w-3 text-[#1a759f] dark:text-[#38bdf8]" />
                  <span className="text-gray-600 dark:text-gray-300 font-mono">+modifiers</span>
                  <span className="text-gray-400 dark:text-gray-500">- priority</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-[#1a759f] dark:text-[#38bdf8]" />
                  <span className="text-gray-600 dark:text-gray-300 font-mono">_dates</span>
                  <span className="text-gray-400 dark:text-gray-500">- tracking</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Nesting Levels */}
          <Card className="hover:shadow-lg dark:hover:shadow-gray-900/50 transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-gray-900 dark:text-gray-100">
                <Layers className="h-4 w-4 text-[#76c893] dark:text-[#4ade80]" />
                Nesting Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-[#76c893] dark:text-[#4ade80] mb-1">3 Levels</p>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p className="mb-1">Subtasks use 4-space indentation</p>
                <div className="font-mono text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded text-gray-700 dark:text-gray-300">
                  - [ ] Parent<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;- [ ] Child<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- [ ] Grandchild
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
