"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  CheckSquare,
  FileText,
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
import { useTasks, useEisenhower, computeTaskStats, type Task } from "@/lib/hooks/use-tasks"
import { useEffect, useCallback } from "react"

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

function CheckboxIcon({ state }: { state: Task['checkboxState'] }) {
  const icons: Record<Task['checkboxState'], { icon: string, color: string }> = {
    ' ': { icon: '[ ]', color: 'text-gray-400' },
    '/': { icon: '[/]', color: 'text-blue-500' },
    'x': { icon: '[x]', color: 'text-green-500' },
    '-': { icon: '[-]', color: 'text-gray-500' },
    '>': { icon: '[>]', color: 'text-yellow-500' },
    '?': { icon: '[?]', color: 'text-red-500' }
  }
  const { icon, color } = icons[state]
  return <span className={`font-mono text-sm ${color}`}>{icon}</span>
}

function LoadingCard() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-2">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </CardHeader>
      <CardContent>
        <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-32"></div>
      </CardContent>
    </Card>
  )
}

function ErrorDisplay({ message }: { message: string }) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span>{message}</span>
        </div>
        <p className="text-sm text-red-500 mt-2">
          Make sure ~/tasks.md exists and the dev server is running.
        </p>
      </CardContent>
    </Card>
  )
}

export default function OverviewPage() {
  const { tasks, isLoading: tasksLoading, error: tasksError, refetch: refetchTasks } = useTasks({ flat: true })
  const { counts: eisenhowerCounts, isLoading: eisenhowerLoading, error: eisenhowerError, refetch: refetchMatrix } = useEisenhower()

  // Listen for quick capture task creation
  const handleTaskCreated = useCallback(() => {
    refetchTasks()
    refetchMatrix()
  }, [refetchTasks, refetchMatrix])

  useEffect(() => {
    window.addEventListener('taskCreated', handleTaskCreated)
    return () => window.removeEventListener('taskCreated', handleTaskCreated)
  }, [handleTaskCreated])

  const stats = computeTaskStats(tasks)
  const isLoading = tasksLoading || eisenhowerLoading
  const error = tasksError || eisenhowerError

  // Get active tasks (not completed, not cancelled)
  const activeTasks = tasks.filter(t =>
    t.status !== 'completed' && t.status !== 'cancelled'
  )

  // Get in-progress task
  const inProgressTask = tasks.find(t => t.status === 'in_progress')

  // Get urgent+important (Q1) tasks
  const q1Tasks = tasks.filter(t =>
    t.isUrgent && t.isImportant &&
    t.status !== 'completed' && t.status !== 'cancelled'
  )

  return (
    <div className="p-4 lg:p-8">
      {/* Hero Section - compact on mobile */}
      <div className="mb-6 lg:mb-12 rounded-2xl bg-gradient-to-br from-[#4a6fa5]/15 via-[#3b82f6]/10 to-[#2c4a6e]/15 p-6 lg:p-12 border border-[#4a6fa5]/20">
        <div className="max-w-4xl">
          <h2 className="text-xs lg:text-sm font-semibold text-[#4a6fa5] uppercase tracking-wide mb-1 lg:mb-2">
            Live Task Dashboard
          </h2>
          <h1 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-2 lg:mb-4">
            tasks-ng
          </h1>
          <p className="text-base lg:text-xl text-gray-600 mb-4 lg:mb-6">
            Real-time view of ~/tasks.md
          </p>
          {isLoading ? (
            <div className="inline-flex items-center gap-2 bg-white rounded-lg px-6 py-4 shadow-lg border">
              <Loader2 className="h-5 w-5 animate-spin text-[#4a6fa5]" />
              <span className="text-gray-600">Loading tasks...</span>
            </div>
          ) : error ? (
            <div className="inline-flex items-center gap-2 bg-red-50 rounded-lg px-6 py-4 border border-red-200">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-600">Could not load tasks</span>
            </div>
          ) : (
            <div className="inline-block bg-white rounded-lg px-6 py-4 shadow-lg border border-[#5a8a72]/30">
              <p className="text-3xl font-bold text-[#5a8a72]">
                {stats.active} Active Tasks
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {stats.total} total across all sections
              </p>
            </div>
          )}
        </div>
      </div>

      {error && <ErrorDisplay message={error} />}

      {/* Current Focus */}
      {inProgressTask && (
        <div className="mb-6 lg:mb-8">
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3 lg:mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 lg:h-6 lg:w-6 text-[#4a6fa5]" />
            Current Focus
          </h2>
          <Card className="border-l-4 border-l-[#4a6fa5] bg-gradient-to-r from-[#4a6fa5]/5 to-transparent">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <CheckboxIcon state={inProgressTask.checkboxState} />
                    <span className="text-xl font-semibold text-gray-900">
                      {inProgressTask.description}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="bg-gray-100 px-2 py-0.5 rounded">
                      {inProgressTask.section}
                    </span>
                    {inProgressTask.tags.map(tag => (
                      <span key={tag} className="text-[#4a6fa5]">#{tag}</span>
                    ))}
                    {inProgressTask.dates.due && (
                      <span className="flex items-center gap-1 text-orange-600">
                        <Calendar className="h-3 w-3" />
                        Due: {inProgressTask.dates.due}
                      </span>
                    )}
                  </div>
                </div>
                <TaskStatusBadge status={inProgressTask.status} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="mb-6 lg:mb-8">
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3 lg:mb-4">Task Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">

          {isLoading ? (
            <>
              <LoadingCard />
              <LoadingCard />
              <LoadingCard />
              <LoadingCard />
            </>
          ) : (
            <>
              {/* Total Tasks */}
              <Card className="border-l-4 border-l-[#4a6fa5] hover:shadow-xl transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <CheckSquare className="h-4 w-4" />
                    Total Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-bold text-gray-900">
                        {stats.total}
                      </span>
                      <Badge variant="primary">{stats.active} Active</Badge>
                    </div>
                    <p className="text-xs text-gray-500 pt-2">
                      {stats.byStatus.completed} completed, {stats.byStatus.cancelled} cancelled
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Q1: Urgent + Important */}
              <Card className="border-l-4 border-l-red-500 hover:shadow-xl transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Do First (Q1)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-bold text-red-600">
                        {eisenhowerCounts?.Q1 ?? 0}
                      </span>
                      <Badge variant="destructive">Urgent + Important</Badge>
                    </div>
                    <p className="text-xs text-gray-500 pt-2">
                      Crisis items requiring immediate attention
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* In Progress */}
              <Card className="border-l-4 border-l-[#5a8a72] hover:shadow-xl transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    In Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-bold text-[#5a8a72]">
                        {stats.byStatus.in_progress}
                      </span>
                      <Badge variant="success">Active</Badge>
                    </div>
                    <p className="text-xs text-gray-500 pt-2">
                      {stats.byStatus.blocked} blocked, {stats.byStatus.deferred} deferred
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Schedule (Q2) */}
              <Card className="border-l-4 border-l-[#b8860b] hover:shadow-xl transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Schedule (Q2)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-bold text-[#b8860b]">
                        {eisenhowerCounts?.Q2 ?? 0}
                      </span>
                      <Badge variant="warning">Important</Badge>
                    </div>
                    <p className="text-xs text-gray-500 pt-2">
                      Strategic tasks to plan for
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Eisenhower Matrix */}
      {!isLoading && !error && eisenhowerCounts && (
        <div className="mb-6 lg:mb-8">
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3 lg:mb-4">Eisenhower Matrix</h2>
          <div className="grid grid-cols-2 gap-2 lg:gap-4">
            <Card className="bg-red-50 border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-800">
                  Q1: Do First
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">{eisenhowerCounts.Q1}</p>
                <p className="text-xs text-red-600/70">Urgent + Important</p>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 border-yellow-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-yellow-800">
                  Q2: Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-yellow-600">{eisenhowerCounts.Q2}</p>
                <p className="text-xs text-yellow-600/70">Important, Not Urgent</p>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 border-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-800">
                  Q3: Delegate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600">{eisenhowerCounts.Q3}</p>
                <p className="text-xs text-orange-600/70">Urgent, Not Important</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-50 border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">
                  Q4: Consider Dropping
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-600">{eisenhowerCounts.Q4}</p>
                <p className="text-xs text-gray-500">Neither Urgent nor Important</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Active Tasks List */}
      {!isLoading && !error && activeTasks.length > 0 && (
        <div className="mb-6 lg:mb-8">
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3 lg:mb-4">Active Tasks</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {activeTasks.slice(0, 10).map(task => (
                  <div
                    key={task.id}
                    className="flex items-start justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border"
                  >
                    <div className="flex items-start gap-3">
                      <CheckboxIcon state={task.checkboxState} />
                      <div>
                        <p className={`font-medium ${task.isUrgent && task.isImportant ? 'text-red-600' : 'text-gray-900'}`}>
                          {task.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <span className="bg-gray-100 px-2 py-0.5 rounded">{task.section}</span>
                          {task.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-[#4a6fa5]">#{tag}</span>
                          ))}
                          {task.isUrgent && <Badge variant="destructive" className="text-[10px]">urgent</Badge>}
                          {task.isImportant && <Badge variant="warning" className="text-[10px]">important</Badge>}
                          {task.dates.due && (
                            <span className="text-orange-600">Due: {task.dates.due}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <TaskStatusBadge status={task.status} />
                  </div>
                ))}
                {activeTasks.length > 10 && (
                  <p className="text-center text-sm text-gray-500 pt-2">
                    + {activeTasks.length - 10} more tasks
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Format Specifications Grid - hidden on mobile for cleaner quick capture experience */}
      <div className="hidden lg:block mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Format Reference</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Checkbox States */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-[#4a6fa5]" />
                Checkbox States
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-gray-400">[ ]</span>
                  <span className="text-gray-600">Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-blue-500">[/]</span>
                  <span className="text-gray-600">In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-green-500">[x]</span>
                  <span className="text-gray-600">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-gray-500">[-]</span>
                  <span className="text-gray-600">Cancelled</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-yellow-500">[&gt;]</span>
                  <span className="text-gray-600">Deferred</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-red-500">[?]</span>
                  <span className="text-gray-600">Blocked</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metadata Prefixes */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5 text-[#2c4a6e]" />
                Metadata Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-[#4a6fa5]" />
                  <span className="text-gray-600 font-mono">#tags</span>
                  <span className="text-gray-500">- categorization</span>
                </div>
                <div className="flex items-center gap-2">
                  <AtSign className="h-4 w-4 text-[#4a6fa5]" />
                  <span className="text-gray-600 font-mono">@mentions</span>
                  <span className="text-gray-500">- assignment</span>
                </div>
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-[#4a6fa5]" />
                  <span className="text-gray-600 font-mono">+modifiers</span>
                  <span className="text-gray-500">- priority</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#4a6fa5]" />
                  <span className="text-gray-600 font-mono">_dates</span>
                  <span className="text-gray-500">- tracking</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Nesting Levels */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-[#5a8a72]" />
                Nesting Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-[#5a8a72] mb-2">3 Levels</p>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Subtasks use 4-space indentation</p>
                <p className="font-mono text-xs bg-gray-50 p-2 rounded">
                  - [ ] Parent<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;- [ ] Child<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- [ ] Grandchild
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
