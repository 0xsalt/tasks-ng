/**
 * Strategy API Route
 *
 * GET /api/strategy - Get strategic planning data from BACKLOG.md
 *
 * Parses BACKLOG.md to extract:
 * - NOW: Current sprint items
 * - BACKLOG: Queued work
 * - ROADMAP: Future planned work
 * - DONE: Completed items
 */

import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

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
}

/**
 * Parse tags from item text
 */
function extractTags(text: string): string[] {
  const matches = text.match(/#[a-z0-9-]+/gi)
  return matches ? matches.map(t => t.slice(1).toLowerCase()) : []
}

/**
 * Parse BACKLOG.md content into structured data
 */
function parseBacklogMarkdown(content: string): StrategyData {
  const data: StrategyData = {
    now: [],
    backlog: [],
    roadmap: [],
    done: [],
    generatedAt: new Date().toISOString(),
    stats: {
      total: 0,
      inProgress: 0,
      queued: 0,
      planned: 0,
      completed: 0,
      epics: 0
    }
  }

  const lines = content.split('\n')
  let currentSection: keyof Pick<StrategyData, 'now' | 'backlog' | 'roadmap' | 'done'> | null = null

  for (const line of lines) {
    const trimmedLine = line.trim()

    // Detect section headers
    if (trimmedLine === '## NOW') {
      currentSection = 'now'
      continue
    } else if (trimmedLine === '## BACKLOG') {
      currentSection = 'backlog'
      continue
    } else if (trimmedLine === '## ROADMAP') {
      currentSection = 'roadmap'
      continue
    } else if (trimmedLine === '## DONE') {
      currentSection = 'done'
      continue
    }

    // Parse task items
    if (currentSection && (trimmedLine.startsWith('- [ ]') || trimmedLine.startsWith('- [x]'))) {
      // Extract task text
      let taskText = trimmedLine.replace(/^- \[[ x]\]\s*/, '')

      // Extract completion date if present [YYYY-MM-DD]
      const dateMatch = taskText.match(/\[(\d{4}-\d{2}-\d{2})\]/)
      let completionDate: string | undefined

      if (dateMatch) {
        completionDate = dateMatch[1]
        taskText = taskText.replace(/\s*\[\d{4}-\d{2}-\d{2}\]/, '')
      }

      // Extract tags
      const tags = extractTags(taskText)
      const isEpic = tags.includes('epic') || taskText.toLowerCase().includes('epic:')

      // Remove tags from display text
      const cleanText = taskText.replace(/#[a-z0-9-]+/gi, '').trim()

      const item: StrategyItem = {
        text: cleanText || taskText,
        completionDate,
        tags,
        isEpic
      }

      data[currentSection].push(item)

      // Update stats
      data.stats.total++
      if (isEpic) data.stats.epics++
    }
  }

  // Calculate section stats
  data.stats.inProgress = data.now.length
  data.stats.queued = data.backlog.length
  data.stats.planned = data.roadmap.length
  data.stats.completed = data.done.length

  return data
}

export async function GET() {
  try {
    // Use env var for Docker deployment, fallback to relative path for local dev
    const backlogPath = process.env.BACKLOG_PATH ||
      path.join(process.cwd(), '..', 'docs', 'BACKLOG.md')

    let content: string
    try {
      content = await fs.readFile(backlogPath, 'utf-8')
    } catch {
      // Try alternative paths
      const altPaths = [
        path.join(process.cwd(), 'docs', 'BACKLOG.md'),
        path.join(process.cwd(), 'BACKLOG.md'),
        '/app/docs/BACKLOG.md'
      ]

      for (const altPath of altPaths) {
        try {
          content = await fs.readFile(altPath, 'utf-8')
          break
        } catch {
          continue
        }
      }

      if (!content!) {
        return NextResponse.json({
          now: [],
          backlog: [],
          roadmap: [],
          done: [],
          generatedAt: new Date().toISOString(),
          stats: {
            total: 0,
            inProgress: 0,
            queued: 0,
            planned: 0,
            completed: 0,
            epics: 0
          },
          error: 'BACKLOG.md not found'
        })
      }
    }

    const data = parseBacklogMarkdown(content)
    return NextResponse.json(data)

  } catch (error) {
    console.error('Failed to parse strategy data:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load strategy' },
      { status: 500 }
    )
  }
}
