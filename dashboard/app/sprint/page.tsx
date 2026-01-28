"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Target,
  Loader2,
  AlertCircle,
  ArrowRight,
  Ban
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SprintStats {
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

interface SprintTask {
  id: string
  description: string
  status: string
  checkboxState: string
  section: string
  tags: string[]
  modifiers: string[]
  isUrgent: boolean
  isImportant: boolean
  dates: {
    due?: string
    done?: string
    created?: string
  }
  daysUntilDue?: number
  isOverdue?: boolean
}

interface SprintSummary {
  generatedAt: string
  stats: SprintStats
  currentFocus: SprintTask | null
  nowTasks: SprintTask[]
  upNext: SprintTask[]
  blockedTasks: SprintTask[]
  recentlyCompleted: SprintTask[]
  overdueTasks: SprintTask[]
}

function CheckboxIcon({
  state,
  taskId,
  onUpdate
}: {
  state: string
  taskId: string
  onUpdate: () => void
}) {
  const [isUpdating, setIsUpdating] = useState(false)

  const icons: Record<string, { icon: string, color: string }> = {
    ' ': { icon: '[ ]', color: 'text-gray-400' },
    '/': { icon: '[/]', color: 'text-blue-500' },
    'x': { icon: '[x]', color: 'text-green-500' },
    '-': { icon: '[-]', color: 'text-gray-500' },
    '>': { icon: '[>]', color: 'text-yellow-500' },
    '?': { icon: '[?]', color: 'text-red-500' }
  }

  const cycleState = (current: string): string => {
    // Simple 3-state cycle: [ ] → [/] → [x] → [ ]
    if (current === ' ') return '/'
    if (current === '/') return 'x'
    if (current === 'x') return ' '
    // For other states, return to pending
    return ' '
  }

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isUpdating) return

    setIsUpdating(true)
    const nextState = cycleState(state)

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

      onUpdate()
    } catch (error) {
      console.error('Error updating checkbox state:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const display = icons[state] ?? icons[' ']!

  return (
    <button
      onClick={handleClick}
      disabled={isUpdating}
      className={`font-mono text-sm ${display.color} ${
        isUpdating ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:scale-110 active:scale-95'
      } transition-all`}
      title="Click to cycle state"
    >
      {display.icon}
    </button>
  )
}

function TaskRow({ task, onUpdate }: { task: SprintTask; onUpdate: () => void }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border">
      <CheckboxIcon state={task.checkboxState} taskId={task.id} onUpdate={onUpdate} />
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-medium text-sm",
          task.isUrgent && task.isImportant && "text-red-600",
          task.isOverdue && "text-orange-600"
        )}>
          {task.description}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-gray-500">
          {task.isUrgent && (
            <Badge variant="destructive" className="text-[10px] py-0">urgent</Badge>
          )}
          {task.isImportant && (
            <Badge variant="warning" className="text-[10px] py-0">important</Badge>
          )}
          {task.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-[#1a759f]">#{tag}</span>
          ))}
          {task.dates.due && (
            <span className={cn(
              "flex items-center gap-1",
              task.isOverdue ? "text-red-600" : "text-orange-500"
            )}>
              <Calendar className="h-3 w-3" />
              {task.isOverdue ? `${Math.abs(task.daysUntilDue || 0)}d overdue` :
                task.daysUntilDue === 0 ? 'Today' :
                  task.daysUntilDue === 1 ? 'Tomorrow' :
                    `${task.daysUntilDue}d`}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  subtext
}: {
  icon: React.ElementType
  label: string
  value: number
  color: string
  subtext?: string
}) {
  return (
    <Card className={cn("border-l-4", color)}>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {subtext && <p className="text-xs text-gray-500 mt-0.5">{subtext}</p>}
          </div>
          <Icon className="h-8 w-8 text-gray-300" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function SprintPage() {
  const [data, setData] = useState<SprintSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSprint = useCallback(async () => {
    try {
      const res = await fetch('/api/sprint')
      if (!res.ok) throw new Error('Failed to fetch sprint data')
      const summary = await res.json()
      setData(summary)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSprint()

    // Refresh on task changes
    const handleTaskChange = () => {
      setTimeout(fetchSprint, 300)
    }
    window.addEventListener('taskCreated', handleTaskChange)

    // Periodic refresh
    const interval = setInterval(fetchSprint, 60000)

    return () => {
      window.removeEventListener('taskCreated', handleTaskChange)
      clearInterval(interval)
    }
  }, [fetchSprint])

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center min-h-[50vh]">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading sprint...</span>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-4 lg:p-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{error || 'Failed to load sprint data'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-[#1a759f]/10">
            <Target className="h-6 w-6 text-[#1a759f]" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Current Sprint</h1>
            <p className="text-sm text-gray-500">
              Focus on NOW section tasks
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <StatCard
          icon={Target}
          label="In Sprint"
          value={data.stats.totalInSprint}
          color="border-l-[#1a759f]"
        />
        <StatCard
          icon={Clock}
          label="In Progress"
          value={data.stats.inProgress}
          color="border-l-blue-500"
        />
        <StatCard
          icon={AlertTriangle}
          label="Overdue"
          value={data.stats.overdue}
          color="border-l-red-500"
        />
        <StatCard
          icon={Calendar}
          label="Due This Week"
          value={data.stats.dueThisWeek}
          color="border-l-orange-500"
        />
      </div>

      {/* Current Focus */}
      {data.currentFocus && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#1a759f]" />
            Current Focus
          </h2>
          <Card className="border-l-4 border-l-[#1a759f] bg-gradient-to-r from-[#1a759f]/5 to-transparent">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <CheckboxIcon state={data.currentFocus.checkboxState} taskId={data.currentFocus.id} onUpdate={fetchSprint} />
                <div className="flex-1">
                  <p className="text-lg font-semibold text-gray-900">
                    {data.currentFocus.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                      {data.currentFocus.section}
                    </span>
                    {data.currentFocus.tags.map(tag => (
                      <span key={tag} className="text-[#1a759f]">#{tag}</span>
                    ))}
                    {data.currentFocus.dates.due && (
                      <span className="text-orange-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due: {data.currentFocus.dates.due}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NOW Tasks */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4 text-[#1a759f]" />
                NOW Tasks
              </span>
              <Badge variant="primary">{data.nowTasks.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.nowTasks.length === 0 ? (
                <p className="text-sm text-gray-400 italic py-4 text-center">
                  No tasks in NOW section
                </p>
              ) : (
                data.nowTasks.slice(0, 8).map(task => (
                  <TaskRow key={task.id} task={task} onUpdate={fetchSprint} />
                ))
              )}
              {data.nowTasks.length > 8 && (
                <p className="text-sm text-gray-500 text-center pt-2">
                  + {data.nowTasks.length - 8} more
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Up Next */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-base">
                <ArrowRight className="h-4 w-4 text-gray-500" />
                Up Next
              </span>
              <Badge variant="secondary">{data.upNext.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.upNext.length === 0 ? (
                <p className="text-sm text-gray-400 italic py-4 text-center">
                  Queue is empty
                </p>
              ) : (
                data.upNext.map(task => (
                  <TaskRow key={task.id} task={task} onUpdate={fetchSprint} />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Overdue */}
        {data.overdueTasks.length > 0 && (
          <Card className="border-red-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-base text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  Overdue
                </span>
                <Badge variant="destructive">{data.overdueTasks.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.overdueTasks.map(task => (
                  <TaskRow key={task.id} task={task} onUpdate={fetchSprint} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Blocked */}
        {data.blockedTasks.length > 0 && (
          <Card className="border-yellow-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-base text-yellow-600">
                  <Ban className="h-4 w-4" />
                  Blocked
                </span>
                <Badge variant="warning">{data.blockedTasks.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.blockedTasks.map(task => (
                  <TaskRow key={task.id} task={task} onUpdate={fetchSprint} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recently Completed */}
        {data.recentlyCompleted.length > 0 && (
          <Card className="border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-base text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Recently Completed
                </span>
                <Badge variant="success">{data.recentlyCompleted.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.recentlyCompleted.map(task => (
                  <div key={task.id} className="flex items-start gap-3 p-2 opacity-60">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-600 line-through">
                        {task.description}
                      </p>
                      {task.dates.done && (
                        <p className="text-xs text-gray-400">{task.dates.done}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer with timestamp */}
      <div className="mt-8 text-center text-xs text-gray-400">
        Last updated: {new Date(data.generatedAt).toLocaleString()}
      </div>
    </div>
  )
}
