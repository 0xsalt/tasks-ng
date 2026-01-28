/**
 * File path resolution with XDG Base Directory compliance
 *
 * Priority order:
 * 1. TASKS_FILE environment variable
 * 2. XDG_DATA_HOME/tasks-ng/tasks.md (if exists)
 * 3. ~/tasks.md (legacy fallback)
 */

import fs from 'fs'
import path from 'path'
import os from 'os'

// XDG Base Directory compliant path
const XDG_DATA_HOME = process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share')
const DEFAULT_TASKS_FILE = path.join(XDG_DATA_HOME, 'tasks-ng', 'tasks.md')
const LEGACY_TASKS_FILE = path.join(os.homedir(), 'tasks.md')

/**
 * Resolve the tasks file path based on priority
 */
export function resolveTasksFile(): string {
  // 1. Environment variable override
  if (process.env.TASKS_FILE) {
    return process.env.TASKS_FILE
  }

  // 2. XDG path if it exists
  if (fs.existsSync(DEFAULT_TASKS_FILE)) {
    return DEFAULT_TASKS_FILE
  }

  // 3. Legacy fallback
  return LEGACY_TASKS_FILE
}

/**
 * Get the backup directory path for the given tasks file
 */
export function getBackupDir(tasksFilePath: string): string {
  return path.join(path.dirname(tasksFilePath), '.task-backups')
}

/**
 * Get the XDG data directory path
 */
export function getXdgDataHome(): string {
  return XDG_DATA_HOME
}

/**
 * Get the default (XDG-compliant) tasks file path
 */
export function getDefaultTasksFile(): string {
  return DEFAULT_TASKS_FILE
}

/**
 * Get the legacy tasks file path
 */
export function getLegacyTasksFile(): string {
  return LEGACY_TASKS_FILE
}

/**
 * Check if a file exists
 */
export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath)
}

/**
 * Ensure the directory for a file path exists
 */
export async function ensureDir(filePath: string): Promise<void> {
  const dir = path.dirname(filePath)
  const fsPromises = await import('fs/promises')
  await fsPromises.mkdir(dir, { recursive: true })
}
