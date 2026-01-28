/**
 * File operations for tasks.md
 * - Atomic writes
 * - Automatic backups
 * - Read with parsing
 */

import fs from 'fs/promises'
import { parseTasksFile } from '@tasks-ng/parser'
import type { ParsedFile } from '@tasks-ng/parser'
import { withLock } from './file-lock.js'
import { resolveTasksFile, getBackupDir, fileExists } from './paths.js'

// Cached resolved path
let _tasksFilePath: string | null = null

/**
 * Get the resolved tasks file path (cached)
 */
export function getTasksFilePath(): string {
  if (!_tasksFilePath) {
    _tasksFilePath = resolveTasksFile()
  }
  return _tasksFilePath
}

/**
 * Reset the cached tasks file path (useful for testing)
 */
export function resetTasksFilePath(): void {
  _tasksFilePath = null
}

/**
 * Check if the tasks file exists
 */
export function tasksFileExists(): boolean {
  return fileExists(getTasksFilePath())
}

/**
 * Read and parse the tasks file
 */
export async function readTasksFile(): Promise<ParsedFile> {
  const filePath = getTasksFilePath()
  const content = await fs.readFile(filePath, 'utf-8')
  return parseTasksFile(content)
}

/**
 * Read the raw content of the tasks file
 */
export async function readTasksFileRaw(): Promise<string> {
  const filePath = getTasksFilePath()
  return fs.readFile(filePath, 'utf-8')
}

/**
 * Create a timestamped backup of content
 */
async function createBackup(content: string): Promise<string> {
  const backupDir = getBackupDir(getTasksFilePath())

  // Ensure backup directory exists
  await fs.mkdir(backupDir, { recursive: true })

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupPath = `${backupDir}/tasks-${timestamp}.md`

  await fs.writeFile(backupPath, content, 'utf-8')

  // Clean old backups (keep last 50)
  await cleanOldBackups(backupDir, 50)

  return backupPath
}

/**
 * Clean old backups, keeping only the most recent N
 */
async function cleanOldBackups(backupDir: string, keepCount: number): Promise<void> {
  try {
    const files = await fs.readdir(backupDir)
    const backups = files
      .filter(f => f.startsWith('tasks-') && f.endsWith('.md'))
      .sort()

    if (backups.length > keepCount) {
      const toDelete = backups.slice(0, backups.length - keepCount)
      for (const file of toDelete) {
        await fs.unlink(`${backupDir}/${file}`)
      }
    }
  } catch {
    // Ignore errors during cleanup
  }
}

/**
 * Write content to the tasks file with atomic write and backup
 *
 * @param content - The content to write
 * @param skipBackup - If true, skip creating a backup (default: false)
 */
export async function writeTasksFile(
  content: string,
  skipBackup = false
): Promise<void> {
  const filePath = getTasksFilePath()

  await withLock(filePath, async () => {
    // Read current content for backup
    let currentContent = ''
    try {
      currentContent = await fs.readFile(filePath, 'utf-8')
    } catch {
      // File may not exist yet
    }

    // Create backup if file has content
    if (currentContent && !skipBackup) {
      await createBackup(currentContent)
    }

    // Atomic write: write to temp file then rename
    const tempPath = `${filePath}.tmp`
    await fs.writeFile(tempPath, content, 'utf-8')
    await fs.rename(tempPath, filePath)
  })
}

/**
 * List all backups
 */
export async function listBackups(): Promise<string[]> {
  const backupDir = getBackupDir(getTasksFilePath())

  try {
    const files = await fs.readdir(backupDir)
    return files
      .filter(f => f.startsWith('tasks-') && f.endsWith('.md'))
      .sort()
      .reverse() // Most recent first
  } catch {
    return []
  }
}

/**
 * Restore from a backup file
 */
export async function restoreBackup(backupName: string): Promise<void> {
  const backupDir = getBackupDir(getTasksFilePath())
  const backupPath = `${backupDir}/${backupName}`

  const content = await fs.readFile(backupPath, 'utf-8')
  await writeTasksFile(content, true) // Skip backup when restoring
}
