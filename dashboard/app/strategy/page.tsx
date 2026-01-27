"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Target,
  Loader2,
  AlertCircle,
  Map,
  Layers,
  CheckCircle2,
  Clock,
  Calendar,
  TrendingUp,
  ArrowRight,
  Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"

interface StrategyItem {
  text: string
  completionDate?: string
  tags?: string[]
  isEpic?: boolean
}

interface StrategyData {
  now: StrategyItem[]
  backlog: StrategyItem[]
  roadmap: StrategyItem[]
  done: StrategyItem[]
  generatedAt: string
  stats: {
    total: number
    inProgress: number
    queued: number
    planned: number
    completed: number
    epics: number
  }
  error?: string
}

function ItemCard({ item, variant }: { item: StrategyItem; variant: 'now' | 'backlog' | 'roadmap' | 'done' }) {
  const variantStyles = {
    now: 'border-l-[#1a759f] bg-[#1a759f]/5',
    backlog: 'border-l-[#1e6091] bg-[#1e6091]/5',
    roadmap: 'border-l-gray-400 bg-gray-50',
    done: 'border-l-[#76c893] bg-[#76c893]/5'
  }

  return (
    <div className={cn(
      "p-3 rounded-lg border-l-4 transition-all hover:shadow-md",
      variantStyles[variant],
      item.isEpic && "ring-1 ring-amber-300"
    )}>
      <div className="flex items-start gap-2">
        {variant === 'done' && (
          <CheckCircle2 className="h-4 w-4 text-[#76c893] mt-0.5 flex-shrink-0" />
        )}
        {item.isEpic && (
          <Sparkles className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm break-words",
            variant === 'done' ? "text-gray-500 line-through" : "text-gray-900"
          )}>
            {item.text}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            {item.isEpic && (
              <Badge variant="warning" className="text-[10px] py-0">Epic</Badge>
            )}
            {item.tags?.filter(t => t !== 'epic').slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] text-[#1a759f]">#{tag}</span>
            ))}
            {item.completionDate && (
              <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                <Calendar className="h-3 w-3" />
                {item.completionDate}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  color
}: {
  icon: React.ElementType
  label: string
  value: number
  color: string
}) {
  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", color)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  )
}

export default function StrategyPage() {
  const [data, setData] = useState<StrategyData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStrategy = useCallback(async () => {
    try {
      const res = await fetch('/api/strategy')
      if (!res.ok) throw new Error('Failed to fetch strategy data')
      const strategyData = await res.json()
      setData(strategyData)
      setError(strategyData.error || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStrategy()

    // Refresh periodically
    const interval = setInterval(fetchStrategy, 120000)
    return () => clearInterval(interval)
  }, [fetchStrategy])

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center min-h-[50vh]">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading strategy...</span>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-4 lg:p-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{error || 'Failed to load strategy data'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate completion percentage
  const completionRate = data.stats.total > 0
    ? Math.round((data.stats.completed / data.stats.total) * 100)
    : 0

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-[#1a759f] to-[#1e6091]">
            <Map className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Strategic Planning</h1>
            <p className="text-sm text-gray-500">
              Long-term view from BACKLOG.md
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4 mb-6">
        <StatCard
          icon={Target}
          label="Total Items"
          value={data.stats.total}
          color="bg-[#1a759f]"
        />
        <StatCard
          icon={Clock}
          label="In Progress"
          value={data.stats.inProgress}
          color="bg-blue-500"
        />
        <StatCard
          icon={Layers}
          label="Queued"
          value={data.stats.queued}
          color="bg-[#1e6091]"
        />
        <StatCard
          icon={TrendingUp}
          label="Roadmap"
          value={data.stats.planned}
          color="bg-gray-500"
        />
        <StatCard
          icon={CheckCircle2}
          label="Completed"
          value={data.stats.completed}
          color="bg-[#76c893]"
        />
      </div>

      {/* Progress Bar */}
      <Card className="mb-6">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-bold text-[#1a759f]">{completionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-[#1a759f] to-[#76c893] h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          {data.stats.epics > 0 && (
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-500" />
              {data.stats.epics} epic{data.stats.epics > 1 ? 's' : ''} tracked
            </p>
          )}
        </CardContent>
      </Card>

      {/* Pipeline View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* NOW */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-[#1a759f]" />
                NOW
              </span>
              <Badge variant="primary">{data.now.length}</Badge>
            </CardTitle>
            <p className="text-xs text-gray-500">Current focus</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.now.length === 0 ? (
                <p className="text-sm text-gray-400 italic text-center py-4">
                  Nothing in progress
                </p>
              ) : (
                data.now.map((item, idx) => (
                  <ItemCard key={idx} item={item} variant="now" />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* BACKLOG */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-base">
                <Layers className="h-4 w-4 text-[#1e6091]" />
                BACKLOG
              </span>
              <Badge variant="default">{data.backlog.length}</Badge>
            </CardTitle>
            <p className="text-xs text-gray-500">Queued for development</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.backlog.length === 0 ? (
                <p className="text-sm text-gray-400 italic text-center py-4">
                  Backlog is empty
                </p>
              ) : (
                data.backlog.slice(0, 8).map((item, idx) => (
                  <ItemCard key={idx} item={item} variant="backlog" />
                ))
              )}
              {data.backlog.length > 8 && (
                <p className="text-xs text-gray-400 text-center pt-2">
                  + {data.backlog.length - 8} more
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ROADMAP */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-base">
                <ArrowRight className="h-4 w-4 text-gray-500" />
                ROADMAP
              </span>
              <Badge variant="secondary">{data.roadmap.length}</Badge>
            </CardTitle>
            <p className="text-xs text-gray-500">Future planned work</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.roadmap.length === 0 ? (
                <p className="text-sm text-gray-400 italic text-center py-4">
                  No roadmap items
                </p>
              ) : (
                data.roadmap.slice(0, 8).map((item, idx) => (
                  <ItemCard key={idx} item={item} variant="roadmap" />
                ))
              )}
              {data.roadmap.length > 8 && (
                <p className="text-xs text-gray-400 text-center pt-2">
                  + {data.roadmap.length - 8} more
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* DONE */}
        <Card className="border-[#76c893]/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-base text-[#76c893]">
                <CheckCircle2 className="h-4 w-4" />
                DONE
              </span>
              <Badge variant="success">{data.done.length}</Badge>
            </CardTitle>
            <p className="text-xs text-gray-500">Completed work</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.done.length === 0 ? (
                <p className="text-sm text-gray-400 italic text-center py-4">
                  Nothing completed yet
                </p>
              ) : (
                data.done.slice(0, 8).map((item, idx) => (
                  <ItemCard key={idx} item={item} variant="done" />
                ))
              )}
              {data.done.length > 8 && (
                <p className="text-xs text-gray-400 text-center pt-2">
                  + {data.done.length - 8} more
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warning if no BACKLOG.md */}
      {error && (
        <Card className="mt-6 border-amber-200 bg-amber-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
            <p className="text-xs text-amber-600 mt-1">
              Create docs/BACKLOG.md with ## NOW, ## BACKLOG, ## ROADMAP, ## DONE sections
            </p>
          </CardContent>
        </Card>
      )}

      {/* Footer with timestamp */}
      <div className="mt-8 text-center text-xs text-gray-400">
        Last updated: {new Date(data.generatedAt).toLocaleString()}
      </div>
    </div>
  )
}
