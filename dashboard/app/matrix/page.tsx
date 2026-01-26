"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEisenhower, type Task } from "@/lib/hooks/use-tasks"
import { Loader2, AlertCircle, Target, Calendar, Users, Trash2 } from "lucide-react"

function TaskItem({ task }: { task: Task }) {
  return (
    <div className="p-3 rounded-lg bg-white/50 border border-white">
      <p className="font-medium text-gray-900 text-sm leading-tight">
        {task.description}
      </p>
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {task.tags.slice(0, 2).map(tag => (
          <span key={tag} className="text-xs text-blue-600">#{tag}</span>
        ))}
        {task.dates.due && (
          <span className="text-xs text-orange-600">Due: {task.dates.due}</span>
        )}
      </div>
    </div>
  )
}

export default function MatrixPage() {
  const { matrix, counts, labels, isLoading, error, refetch } = useEisenhower()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading matrix...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const quadrants = [
    {
      key: 'Q1',
      title: 'Do First',
      subtitle: 'Urgent + Important',
      icon: Target,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      titleColor: 'text-red-800',
      countColor: 'text-red-600',
      tasks: matrix?.Q1 ?? [],
    },
    {
      key: 'Q2',
      title: 'Schedule',
      subtitle: 'Important, Not Urgent',
      icon: Calendar,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      titleColor: 'text-yellow-800',
      countColor: 'text-yellow-600',
      tasks: matrix?.Q2 ?? [],
    },
    {
      key: 'Q3',
      title: 'Delegate',
      subtitle: 'Urgent, Not Important',
      icon: Users,
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      titleColor: 'text-orange-800',
      countColor: 'text-orange-600',
      tasks: matrix?.Q3 ?? [],
    },
    {
      key: 'Q4',
      title: 'Consider Dropping',
      subtitle: 'Neither',
      icon: Trash2,
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      titleColor: 'text-gray-700',
      countColor: 'text-gray-600',
      tasks: matrix?.Q4 ?? [],
    },
  ]

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
          Eisenhower Matrix
        </h1>
        <p className="text-gray-600">
          {counts?.total ?? 0} active tasks prioritized
        </p>
      </div>

      {/* Matrix Grid - 2x2 on all screens */}
      <div className="grid grid-cols-2 gap-3 lg:gap-4">
        {quadrants.map((q) => (
          <Card key={q.key} className={`${q.bgColor} ${q.borderColor}`}>
            <CardHeader className="pb-2 p-3 lg:p-6 lg:pb-2">
              <CardTitle className={`text-sm lg:text-base font-semibold ${q.titleColor} flex items-center gap-2`}>
                <q.icon className="h-4 w-4" />
                {q.title}
              </CardTitle>
              <p className="text-xs text-gray-500">{q.subtitle}</p>
            </CardHeader>
            <CardContent className="p-3 lg:p-6 pt-0 lg:pt-0">
              <p className={`text-2xl lg:text-3xl font-bold ${q.countColor} mb-3`}>
                {q.tasks.length}
              </p>
              <div className="space-y-2 max-h-[200px] lg:max-h-[300px] overflow-y-auto">
                {q.tasks.slice(0, 5).map(task => (
                  <TaskItem key={task.id} task={task} />
                ))}
                {q.tasks.length > 5 && (
                  <p className="text-xs text-gray-500 text-center pt-2">
                    +{q.tasks.length - 5} more
                  </p>
                )}
                {q.tasks.length === 0 && (
                  <p className="text-xs text-gray-400 italic">No tasks</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
