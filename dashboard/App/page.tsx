import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckSquare, FileText, GitBranch, Layers, Hash, AtSign, Plus, Calendar } from "lucide-react"

export default function OverviewPage() {
  // Project metrics
  const metrics = {
    specVersion: "2.0.0",
    status: "Format specification v2.0.0 is stable",
    roadmapItems: 4,
    backlog: {
      now: 1,
      backlog: 5,
      roadmap: 4,
      done: 9,
      total: 19
    },
    format: {
      checkboxStates: 6,
      metadataTypes: 4,
      nestingLevels: 3
    }
  }

  return (
    <div className="p-8">
      {/* Hero Section */}
      <div className="mb-12 rounded-2xl bg-gradient-to-br from-[#2e7de9]/10 via-[#9854f1]/5 to-[#33b579]/10 p-12 border border-[#2e7de9]/20">
        <div className="max-w-4xl">
          <h2 className="text-sm font-semibold text-[#2e7de9] uppercase tracking-wide mb-2">
            Plain-Text Task Management
          </h2>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            tasks-ng
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Plain-text task management with grep-friendly metadata
          </p>
          <div className="inline-block bg-white rounded-lg px-6 py-4 shadow-lg border border-[#33b579]/30">
            <p className="text-3xl font-bold text-[#33b579]">
              Spec Version {metrics.specVersion}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Stable format specification
            </p>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Executive Summary</h2>
        <Card>
          <CardContent className="pt-6">
            <p className="text-lg text-gray-700 leading-relaxed">
              <strong>tasks-ng</strong> is a task format specification and tooling for managing
              tasks in Markdown files. Designed for both human editing and machine parsing, it
              features a six-state checkbox system for visual scanning, grep-friendly metadata
              with consistent prefixes, Eisenhower matrix integration for priority management,
              and support for nested subtasks up to 3 levels deep. The format emphasizes
              simplicity, discoverability, and seamless integration with existing text-based
              workflows.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics Grid */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Project Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* Spec Version */}
          <Card className="border-l-4 border-l-[#2e7de9] hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Specification Version
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-bold text-gray-900">
                    {metrics.specVersion}
                  </span>
                  <Badge variant="success">Stable</Badge>
                </div>
                <p className="text-xs text-gray-500 pt-2">
                  Format specification is stable and production-ready
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Total Backlog Items */}
          <Card className="border-l-4 border-l-[#33b579] hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Total Work Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-bold text-gray-900">
                    {metrics.backlog.total}
                  </span>
                  <Badge variant="primary">{metrics.backlog.done} Done</Badge>
                </div>
                <p className="text-xs text-gray-500 pt-2">
                  Tracked across NOW, BACKLOG, ROADMAP, and DONE
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Roadmap Items */}
          <Card className="border-l-4 border-l-[#9854f1] hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                Roadmap Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-bold text-gray-900">
                    {metrics.roadmapItems}
                  </span>
                  <Badge variant="secondary">Planned</Badge>
                </div>
                <p className="text-xs text-gray-500 pt-2">
                  Future features including parser module and API
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Active Work */}
          <Card className="border-l-4 border-l-[#f0a020] hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Active Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-bold text-gray-900">
                    {metrics.backlog.now + metrics.backlog.backlog}
                  </span>
                  <Badge variant="warning">In Progress</Badge>
                </div>
                <p className="text-xs text-gray-500 pt-2">
                  {metrics.backlog.now} NOW + {metrics.backlog.backlog} BACKLOG items
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Format Specifications Grid */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Format Specifications</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Checkbox States */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-[#2e7de9]" />
                Checkbox States
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-[#2e7de9] mb-4">
                {metrics.format.checkboxStates}
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">[ ]</Badge>
                  <span className="text-gray-600">Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="primary">[/]</Badge>
                  <span className="text-gray-600">In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success">[x]</Badge>
                  <span className="text-gray-600">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">[-]</Badge>
                  <span className="text-gray-600">Cancelled, Blocked, Deferred</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metadata Prefixes */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5 text-[#9854f1]" />
                Metadata Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-[#9854f1] mb-4">
                {metrics.format.metadataTypes}
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-[#2e7de9]" />
                  <span className="text-gray-600 font-mono">#tags</span>
                  <span className="text-gray-500">- categorization</span>
                </div>
                <div className="flex items-center gap-2">
                  <AtSign className="h-4 w-4 text-[#2e7de9]" />
                  <span className="text-gray-600 font-mono">@mentions</span>
                  <span className="text-gray-500">- assignment</span>
                </div>
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-[#2e7de9]" />
                  <span className="text-gray-600 font-mono">+modifiers</span>
                  <span className="text-gray-500">- priority</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#2e7de9]" />
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
                <Layers className="h-5 w-5 text-[#33b579]" />
                Nesting Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-[#33b579] mb-4">
                {metrics.format.nestingLevels} Levels
              </p>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Subtasks use 4-space indentation</p>
                <p className="font-mono text-xs bg-gray-50 p-2 rounded">
                  - [ ] Parent<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;- [ ] Child<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- [ ] Grandchild
                </p>
                <p className="text-xs text-gray-500">
                  Parent completion requires all children complete
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Backlog Distribution */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Work Distribution</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-[#f0a020] mb-2">
                  {metrics.backlog.now}
                </div>
                <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  NOW
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Current focus
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-[#2e7de9] mb-2">
                  {metrics.backlog.backlog}
                </div>
                <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  BACKLOG
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Ready to start
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-[#9854f1] mb-2">
                  {metrics.backlog.roadmap}
                </div>
                <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  ROADMAP
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Future features
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-[#33b579] mb-2">
                  {metrics.backlog.done}
                </div>
                <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  DONE
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Completed work
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Highlight */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Eisenhower Matrix Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-3">
                Priority management using <code className="bg-gray-100 px-2 py-1 rounded text-sm">+urgent</code> and <code className="bg-gray-100 px-2 py-1 rounded text-sm">+important</code> modifiers that combine for quadrant-based prioritization.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Badge variant="destructive">Q1: Urgent + Important</Badge>
                <Badge variant="primary">Q2: Important</Badge>
                <Badge variant="warning">Q3: Urgent</Badge>
                <Badge variant="secondary">Q4: Neither</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Grep-Friendly Design</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-3">
                All metadata uses consistent prefixes for simple command-line filtering and searching across task files.
              </p>
              <div className="space-y-1 text-xs font-mono bg-gray-50 p-3 rounded">
                <div>grep "#frontend" tasks.md</div>
                <div>grep "@alice" tasks.md</div>
                <div>grep "+urgent" tasks.md</div>
                <div>grep "_due:" tasks.md</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Time Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-3">
                Built-in time tracking with <code className="bg-gray-100 px-2 py-1 rounded text-sm">_spent:</code> metadata stores minutes for simple summation and reporting.
              </p>
              <div className="text-xs font-mono bg-gray-50 p-3 rounded">
                - [x] Design mockups #frontend _done:2026-01-08 _spent:180
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">CLI Tooling</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-3">
                Command-line tools for filtering, listing, and managing tasks with support for state transitions and completion validation.
              </p>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Filter by tag, status, or priority</li>
                <li>• Validate task format compliance</li>
                <li>• Migrate completed tasks to archive</li>
                <li>• Time tracking summaries</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
