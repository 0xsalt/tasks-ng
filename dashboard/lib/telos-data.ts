import fs from 'fs'
import path from 'path'
import os from 'os'

export interface TelosFile {
  name: string
  filename: string
  content: string
  type: 'markdown' | 'csv'
}

export interface BacklogSection {
  title: string
  items: BacklogItem[]
}

export interface BacklogItem {
  text: string
  checked: boolean
  date?: string
}

export interface BacklogStats {
  now: number
  backlog: number
  roadmap: number
  done: number
  total: number
}

// Use DOCS_DIR env var for Docker container, fallback to project directory for local dev
// Docker sets DOCS_DIR=/app/docs (where docs are mounted)
// Local dev uses ~/local/projects/tasks-ng/docs
const DOCS_DIR = process.env.DOCS_DIR || path.join(os.homedir(), 'local/projects/tasks-ng/docs')
const PROJECT_DIR = process.env.DOCS_DIR ? '/app' : path.join(os.homedir(), 'local/projects/tasks-ng')

export function getAllTelosData(): TelosFile[] {
  const files: TelosFile[] = []

  try {
    // In Docker: only scan DOCS_DIR (mounted docs directory)
    // In local dev: scan both project root and docs/

    // Scan for .md files in project root (local dev only)
    if (!process.env.DOCS_DIR && fs.existsSync(PROJECT_DIR)) {
      const rootFiles = fs.readdirSync(PROJECT_DIR)

      for (const filename of rootFiles) {
        if (filename.endsWith('.md') && !filename.startsWith('.')) {
          try {
            const filePath = path.join(PROJECT_DIR, filename)
            const stats = fs.statSync(filePath)

            if (stats.isFile()) {
              const content = fs.readFileSync(filePath, 'utf-8')
              files.push({
                name: filename.replace('.md', ''),
                filename,
                content,
                type: 'markdown',
              })
            }
          } catch (error) {
            console.error(`Error reading ${filename}:`, error)
          }
        }
      }
    }

    // Scan docs directory (works for both Docker and local dev)
    if (fs.existsSync(DOCS_DIR)) {
      const docsFiles = fs.readdirSync(DOCS_DIR)

      for (const filename of docsFiles) {
        if (filename.endsWith('.md') && !filename.startsWith('.')) {
          try {
            const filePath = path.join(DOCS_DIR, filename)
            const stats = fs.statSync(filePath)

            if (stats.isFile()) {
              const content = fs.readFileSync(filePath, 'utf-8')
              files.push({
                name: filename.replace('.md', ''),
                filename: `docs/${filename}`,
                content,
                type: 'markdown',
              })
            }
          } catch (error) {
            console.error(`Error reading docs/${filename}:`, error)
          }
        }
      }
    }
  } catch (error) {
    console.error('Error scanning tasks-ng directory:', error)
  }

  // Sort files: put core documentation files first, then alphabetically
  const coreFiles = ['README', 'CHANGELOG', 'BACKLOG', 'SPEC', 'IDEAS', 'TASK-MANAGEMENT']
  files.sort((a, b) => {
    const aIsCore = coreFiles.includes(a.name)
    const bIsCore = coreFiles.includes(b.name)

    if (aIsCore && !bIsCore) return -1
    if (!aIsCore && bIsCore) return 1
    if (aIsCore && bIsCore) {
      return coreFiles.indexOf(a.name) - coreFiles.indexOf(b.name)
    }
    return a.name.localeCompare(b.name)
  })

  return files
}

export function getTelosContext(): string {
  const files = getAllTelosData()

  let context = "# tasks-ng Project Documentation\n\n"
  context += "You have access to the complete tasks-ng project documentation. Use this information to answer questions about the task format specification, features, roadmap, and implementation details.\n\n"

  for (const file of files) {
    context += `\n## ${file.name}\n\n`
    context += file.content
    context += '\n\n---\n\n'
  }

  return context
}

export function getTelosFileList(): string[] {
  const files = getAllTelosData()
  return files.map(f => f.filename)
}

export function getTelosFileCount(): number {
  const files = getAllTelosData()
  return files.length
}

/**
 * Parse BACKLOG.md into structured sections
 * Returns sections with their items parsed
 */
export function parseBacklog(): BacklogSection[] {
  const backlogPath = process.env.BACKLOG_PATH || path.join(DOCS_DIR, 'BACKLOG.md')

  if (!fs.existsSync(backlogPath)) {
    console.error('BACKLOG.md not found')
    return []
  }

  const content = fs.readFileSync(backlogPath, 'utf-8')
  const lines = content.split('\n')
  const sections: BacklogSection[] = []

  let currentSection: BacklogSection | null = null

  for (const line of lines) {
    // Check for section headers (## NOW, ## BACKLOG, etc.)
    const sectionMatch = line.match(/^##\s+(.+)$/)
    if (sectionMatch && sectionMatch[1]) {
      const title = sectionMatch[1].trim()

      // Only parse known sections
      if (['NOW', 'BACKLOG', 'ROADMAP', 'DONE'].includes(title)) {
        currentSection = { title, items: [] }
        sections.push(currentSection)
      } else {
        currentSection = null
      }
      continue
    }

    // Parse task items if we're in a section
    if (currentSection && line.trim().startsWith('- [')) {
      const itemMatch = line.match(/^-\s+\[(.)\]\s+(.+?)(?:\s+\[(\d{4}-\d{2}-\d{2})\])?$/)
      if (itemMatch && itemMatch[1] && itemMatch[2]) {
        const checked = itemMatch[1] === 'x'
        const text = itemMatch[2].trim()
        const date = itemMatch[3]

        currentSection.items.push({
          text,
          checked,
          ...(date && { date })
        })
      }
    }
  }

  return sections
}

/**
 * Count items by status in each BACKLOG section
 * Returns counts for each section and total
 */
export function countBacklogItems(): BacklogStats {
  const sections = parseBacklog()
  const stats: BacklogStats = {
    now: 0,
    backlog: 0,
    roadmap: 0,
    done: 0,
    total: 0
  }

  for (const section of sections) {
    const count = section.items.length

    switch (section.title) {
      case 'NOW':
        stats.now = count
        break
      case 'BACKLOG':
        stats.backlog = count
        break
      case 'ROADMAP':
        stats.roadmap = count
        break
      case 'DONE':
        stats.done = count
        break
    }

    stats.total += count
  }

  return stats
}

/**
 * Get specific section from BACKLOG.md
 */
export function getBacklogSection(sectionName: 'NOW' | 'BACKLOG' | 'ROADMAP' | 'DONE'): BacklogSection | undefined {
  const sections = parseBacklog()
  return sections.find(s => s.title === sectionName)
}

/**
 * Get all pending (unchecked) items across all sections except DONE
 */
export function getPendingBacklogItems(): BacklogItem[] {
  const sections = parseBacklog()
  const pending: BacklogItem[] = []

  for (const section of sections) {
    if (section.title !== 'DONE') {
      pending.push(...section.items.filter(item => !item.checked))
    }
  }

  return pending
}
