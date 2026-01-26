import { promises as fs } from "fs"
import path from "path"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2 } from "lucide-react"

// Force dynamic rendering - this page reads from filesystem at runtime
export const dynamic = 'force-dynamic'

interface BacklogItem {
  text: string
  completionDate?: string
}

interface BacklogData {
  now: BacklogItem[]
  backlog: BacklogItem[]
  roadmap: BacklogItem[]
  done: BacklogItem[]
}

function parseBacklogMarkdown(content: string): BacklogData {
  const data: BacklogData = {
    now: [],
    backlog: [],
    roadmap: [],
    done: []
  }

  const lines = content.split("\n")
  let currentSection: keyof BacklogData | null = null

  for (const line of lines) {
    const trimmedLine = line.trim()

    // Detect section headers
    if (trimmedLine === "## NOW") {
      currentSection = "now"
      continue
    } else if (trimmedLine === "## BACKLOG") {
      currentSection = "backlog"
      continue
    } else if (trimmedLine === "## ROADMAP") {
      currentSection = "roadmap"
      continue
    } else if (trimmedLine === "## DONE") {
      currentSection = "done"
      continue
    }

    // Parse task items
    if (currentSection && (trimmedLine.startsWith("- [ ]") || trimmedLine.startsWith("- [x]"))) {
      // Extract task text
      let taskText = trimmedLine.replace(/^- \[[ x]\]\s*/, "")

      // Extract completion date if present [YYYY-MM-DD]
      const dateMatch = taskText.match(/\[(\d{4}-\d{2}-\d{2})\]/)
      let completionDate: string | undefined

      if (dateMatch) {
        completionDate = dateMatch[1]
        taskText = taskText.replace(/\s*\[\d{4}-\d{2}-\d{2}\]/, "")
      }

      data[currentSection].push({
        text: taskText,
        completionDate
      })
    }
  }

  return data
}

export default async function BacklogPage() {
  // Read and parse BACKLOG.md server-side
  // Use env var for Docker deployment, fallback to relative path for local dev
  const backlogPath = process.env.BACKLOG_PATH || path.join(process.cwd(), "..", "docs", "BACKLOG.md")

  let backlogData: BacklogData = { now: [], backlog: [], roadmap: [], done: [] }
  try {
    const content = await fs.readFile(backlogPath, "utf-8")
    backlogData = parseBacklogMarkdown(content)
  } catch (error) {
    console.error("Failed to read BACKLOG.md:", error)
    // Continue with empty data - page will show "No items"
  }

  const columns = [
    {
      title: "NOW",
      items: backlogData.now,
      borderColor: "border-l-[#4a6fa5]",
      badgeVariant: "primary" as const,
      description: "Current work in progress"
    },
    {
      title: "BACKLOG",
      items: backlogData.backlog,
      borderColor: "border-l-[#2c4a6e]",
      badgeVariant: "default" as const,
      description: "Queued for development"
    },
    {
      title: "ROADMAP",
      items: backlogData.roadmap,
      borderColor: "border-l-gray-400",
      badgeVariant: "secondary" as const,
      description: "Future planned work"
    },
    {
      title: "DONE",
      items: backlogData.done,
      borderColor: "border-l-[#5a8a72]",
      badgeVariant: "success" as const,
      description: "Completed tasks"
    }
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Project Backlog</h1>
        <p className="text-lg text-gray-600">
          Track tasks across all stages of development
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((column) => (
          <div key={column.title} className="flex flex-col">
            <Card className={`border-l-4 ${column.borderColor} flex-1`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-xl">{column.title}</span>
                  <Badge variant={column.badgeVariant}>
                    {column.items.length}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">{column.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {column.items.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No items</p>
                  ) : (
                    column.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          {column.title === "DONE" && (
                            <CheckCircle2 className="h-4 w-4 text-[#5a8a72] mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 break-words">
                              {item.text}
                            </p>
                            {item.completionDate && (
                              <p className="text-xs text-gray-500 mt-1">
                                {item.completionDate}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}
