"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { AlertCircle, BarChart2, Download, Filter, Loader2, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// ============================================================================
// Types
// ============================================================================

interface TaskDates {
  due?: string
  done?: string
  created?: string
  last_in_progress?: string
}

interface ReportTask {
  id: string
  description: string
  section: string
  tags: string[]
  status: string
  dates: TaskDates
  timeSpent?: number
}

// ============================================================================
// Helpers
// ============================================================================

/** Format YYYY-MM-DD string from a Date */
function toDateString(d: Date): string {
  return d.toISOString().substring(0, 10)
}

/** Today minus N days */
function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return toDateString(d)
}

/** Format minutes as "Xh Ym", "Ym", or "—" */
function formatTimeSpent(minutes: number | undefined): string {
  if (!minutes || minutes === 0) return "—"
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

/** Get done date as YYYY-MM-DD string, or empty string */
function getDoneDate(task: ReportTask): string {
  return task.dates.done ? task.dates.done.substring(0, 10) : ""
}

/** RFC-4180 CSV quoting: wrap in quotes if field contains comma, quote, or newline */
function csvQuote(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/** Build CSV content from tasks */
function buildCsv(tasks: ReportTask[]): string {
  const header = ["id", "description", "section", "tags", "status", "done_date", "time_spent_minutes"]
  const rows = tasks.map(t => [
    csvQuote(t.id),
    csvQuote(t.description),
    csvQuote(t.section),
    csvQuote(t.tags.join(";")),
    csvQuote(t.status),
    csvQuote(getDoneDate(t)),
    csvQuote(t.timeSpent !== undefined ? String(t.timeSpent) : ""),
  ])
  return [header.join(","), ...rows.map(r => r.join(","))].join("\r\n")
}

// ============================================================================
// Sub-components
// ============================================================================

function StatsBar({ tasks }: { tasks: ReportTask[] }) {
  const totalTime = tasks.reduce((sum, t) => sum + (t.timeSpent ?? 0), 0)
  const noTimeCount = tasks.filter(t => !t.timeSpent || t.timeSpent === 0).length

  return (
    <div className="flex flex-wrap gap-4 p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] mb-4">
      <div className="flex flex-col">
        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tasks</span>
        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{tasks.length}</span>
      </div>
      <div className="w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />
      <div className="flex flex-col">
        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Time</span>
        <span className="text-2xl font-bold text-[#1a759f] dark:text-[#38bdf8]">{formatTimeSpent(totalTime)}</span>
      </div>
      <div className="w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />
      <div className="flex flex-col">
        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">No Time Data</span>
        <span className="text-2xl font-bold text-gray-500 dark:text-gray-400">{noTimeCount}</span>
      </div>
    </div>
  )
}

function TaskTable({ tasks }: { tasks: ReportTask[] }) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">No completed tasks match your filters.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--card-border)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--card-border)] bg-gray-50 dark:bg-gray-800/60">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
              Done Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Description
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
              Section
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Tags
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
              Time Spent
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
          {tasks.map(task => (
            <tr
              key={task.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
            >
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap font-mono text-xs">
                {getDoneDate(task) || "—"}
              </td>
              <td className="px-4 py-3 max-w-xs">
                <p
                  className="line-clamp-2 text-gray-900 dark:text-gray-100 leading-relaxed"
                  title={task.description}
                >
                  {task.description}
                </p>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded px-2 py-0.5 text-xs">
                  {task.section}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {task.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-[#1a759f] dark:text-[#38bdf8] text-xs"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-400 font-mono text-xs">
                {formatTimeSpent(task.timeSpent)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ============================================================================
// Main Page
// ============================================================================

export default function ReportingPage() {
  // --- Data state ---
  const [allTasks, setAllTasks] = useState<ReportTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // --- Filter state ---
  const [dateFrom, setDateFrom] = useState(() => daysAgo(29))
  const [dateTo, setDateTo] = useState(() => toDateString(new Date()))
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [selectedSection, setSelectedSection] = useState("")
  const [includeCancelled, setIncludeCancelled] = useState(false)

  // --- Mobile filter panel toggle ---
  const [filtersOpen, setFiltersOpen] = useState(false)

  // --- Fetch tasks ---
  const fetchTasks = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch both completed and cancelled so the client-side toggle works
      const params = new URLSearchParams({
        status: "completed,cancelled",
        includeCompleted: "true",
        flat: "true",
      })

      // Only add date params if both fields are non-empty
      if (dateFrom) params.set("doneAfter", dateFrom)
      if (dateTo) params.set("doneBefore", dateTo)

      const res = await fetch(`/api/tasks?${params.toString()}`)

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `API error ${res.status}`)
      }

      const data = await res.json()
      // data.tasks is the array; sort by done date descending
      const tasks: ReportTask[] = (data.tasks ?? []).sort((a: ReportTask, b: ReportTask) => {
        const da = getDoneDate(a)
        const db = getDoneDate(b)
        if (da > db) return -1
        if (da < db) return 1
        return 0
      })
      setAllTasks(tasks)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tasks")
    } finally {
      setIsLoading(false)
    }
  }, [dateFrom, dateTo])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // --- Derived data ---
  const uniqueTags = useMemo(() => {
    const tagSet = new Set<string>()
    for (const task of allTasks) {
      for (const tag of task.tags) {
        tagSet.add(tag)
      }
    }
    return Array.from(tagSet).sort()
  }, [allTasks])

  const uniqueSections = useMemo(() => {
    const sectionSet = new Set<string>()
    for (const task of allTasks) {
      if (task.section) sectionSet.add(task.section)
    }
    return Array.from(sectionSet).sort()
  }, [allTasks])

  // --- Filtering ---
  const filteredTasks = useMemo(() => {
    let tasks = allTasks

    // The API always fetches completed + cancelled; the toggle controls whether
    // cancelled tasks appear in the filtered view
    if (includeCancelled) {
      tasks = tasks.filter(t => t.status === "completed" || t.status === "cancelled")
    } else {
      tasks = tasks.filter(t => t.status === "completed")
    }

    // Tag filter (OR logic)
    if (selectedTags.size > 0) {
      tasks = tasks.filter(t => t.tags.some(tag => selectedTags.has(tag)))
    }

    // Section filter
    if (selectedSection) {
      tasks = tasks.filter(t => t.section === selectedSection)
    }

    return tasks
  }, [allTasks, selectedTags, selectedSection, includeCancelled])

  // --- Handlers ---
  const toggleTag = useCallback((tag: string) => {
    setSelectedTags(prev => {
      const next = new Set(prev)
      if (next.has(tag)) {
        next.delete(tag)
      } else {
        next.add(tag)
      }
      return next
    })
  }, [])

  const handleExportCsv = useCallback(() => {
    const csv = buildCsv(filteredTasks)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `completed-tasks-${toDateString(new Date())}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [filteredTasks])

  // ============================================================================
  // Filter Panel (shared between mobile and desktop)
  // ============================================================================
  const filterPanel = (
    <div className="space-y-6">
      {/* Date Range */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Date Range
        </h3>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a759f] dark:focus:ring-[#38bdf8]"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a759f] dark:focus:ring-[#38bdf8]"
            />
          </div>
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(""); setDateTo("") }}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
            >
              Clear dates (show all)
            </button>
          )}
        </div>
      </div>

      {/* Section */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Section
        </h3>
        <select
          value={selectedSection}
          onChange={e => setSelectedSection(e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a759f] dark:focus:ring-[#38bdf8]"
        >
          <option value="">All sections</option>
          {uniqueSections.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Tags */}
      {uniqueTags.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Tags
          </h3>
          <div className="space-y-2">
            {uniqueTags.map(tag => (
              <label key={tag} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedTags.has(tag)}
                  onChange={() => toggleTag(tag)}
                  className="rounded border-gray-300 dark:border-gray-600 text-[#1a759f] dark:text-[#38bdf8] focus:ring-[#1a759f] dark:focus:ring-[#38bdf8]"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-[#1a759f] dark:group-hover:text-[#38bdf8] transition-colors">
                  #{tag}
                </span>
              </label>
            ))}
          </div>
          {selectedTags.size > 0 && (
            <button
              onClick={() => setSelectedTags(new Set())}
              className="mt-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
            >
              Clear tags
            </button>
          )}
        </div>
      )}

      {/* Include Cancelled */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Options
        </h3>
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={includeCancelled}
            onChange={e => setIncludeCancelled(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600 text-[#1a759f] dark:text-[#38bdf8] focus:ring-[#1a759f] dark:focus:ring-[#38bdf8]"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-[#1a759f] dark:group-hover:text-[#38bdf8] transition-colors">
            Include cancelled
          </span>
        </label>
      </div>
    </div>
  )

  return (
    <div className="p-4 lg:p-8">
      {/* Page Header */}
      <div className="mb-6 lg:mb-8 rounded-2xl bg-gradient-to-br from-[#1a759f]/15 via-[#3b82f6]/10 to-[#1e6091]/15 dark:from-[#38bdf8]/20 dark:via-[#60a5fa]/15 dark:to-[#818cf8]/20 p-6 lg:p-8 border border-[#1a759f]/20 dark:border-[#38bdf8]/30">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xs lg:text-sm font-semibold text-[#1a759f] dark:text-[#38bdf8] uppercase tracking-wide mb-1">
              Completed Task History
            </h2>
            <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-3">
              <BarChart2 className="h-7 w-7 lg:h-9 lg:w-9 text-[#1a759f] dark:text-[#38bdf8]" />
              Reporting
            </h1>
            <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
              Browse and export completed tasks with filters
            </p>
          </div>

          {/* Export button */}
          {!isLoading && !error && filteredTasks.length > 0 && (
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a759f] dark:bg-[#38bdf8] text-white dark:text-gray-900 font-medium text-sm hover:opacity-90 transition-opacity shrink-0"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Mobile: Filter toggle button */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setFiltersOpen(prev => !prev)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:border-[#1a759f] dark:hover:border-[#38bdf8] transition-colors"
        >
          {filtersOpen ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
          {filtersOpen ? "Hide Filters" : "Filters"}
          {(selectedTags.size > 0 || selectedSection || includeCancelled) && (
            <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#1a759f] dark:bg-[#38bdf8] text-white dark:text-gray-900 text-xs font-bold">
              {[selectedTags.size > 0 ? 1 : 0, selectedSection ? 1 : 0, includeCancelled ? 1 : 0].reduce((a, b) => a + b, 0)}
            </span>
          )}
        </button>

        {/* Mobile filter panel */}
        {filtersOpen && (
          <Card className="mt-3">
            <CardContent className="pt-5">
              {filterPanel}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main layout: desktop sidebar + table */}
      <div className="flex gap-6">
        {/* Desktop filter sidebar */}
        <aside className="hidden lg:block w-56 shrink-0">
          <Card className="sticky top-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Filter className="h-4 w-4 text-[#1a759f] dark:text-[#38bdf8]" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filterPanel}
            </CardContent>
          </Card>
        </aside>

        {/* Right: stats + table */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#1a759f] dark:text-[#38bdf8]" />
            </div>
          ) : error ? (
            <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Failed to load tasks</span>
                </div>
                <p className="text-sm text-red-500 dark:text-red-400 mt-2">{error}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <StatsBar tasks={filteredTasks} />
              <TaskTable tasks={filteredTasks} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
