/**
 * Simple file-based mutex for concurrent write safety
 * Uses a lock file with timeout-based expiry
 */

import fs from 'fs/promises'
import path from 'path'
import os from 'os'

const LOCK_TIMEOUT_MS = 10000 // 10 second lock timeout
const POLL_INTERVAL_MS = 50 // Check lock every 50ms
const MAX_WAIT_MS = 15000 // Max 15 seconds waiting for lock

interface LockInfo {
  pid: number
  timestamp: number
}

export class FileLock {
  private lockPath: string
  private acquired = false

  constructor(filePath: string) {
    // Create lock file path in same directory as the file
    const dir = path.dirname(filePath)
    const basename = path.basename(filePath)
    this.lockPath = path.join(dir, `.${basename}.lock`)
  }

  async acquire(): Promise<boolean> {
    const startTime = Date.now()

    while (Date.now() - startTime < MAX_WAIT_MS) {
      try {
        // Check if lock exists and is still valid
        const lockInfo = await this.readLock()

        if (lockInfo) {
          // Check if lock is expired
          if (Date.now() - lockInfo.timestamp > LOCK_TIMEOUT_MS) {
            // Stale lock, remove it
            await this.releaseLockFile()
          } else {
            // Lock is held by another process, wait
            await this.sleep(POLL_INTERVAL_MS)
            continue
          }
        }

        // Try to acquire lock
        const info: LockInfo = {
          pid: process.pid,
          timestamp: Date.now()
        }

        await fs.writeFile(this.lockPath, JSON.stringify(info), { flag: 'wx' })
        this.acquired = true
        return true
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'EEXIST') {
          // Lock file already exists, wait and retry
          await this.sleep(POLL_INTERVAL_MS)
        } else {
          throw error
        }
      }
    }

    return false // Timeout waiting for lock
  }

  async release(): Promise<void> {
    if (this.acquired) {
      await this.releaseLockFile()
      this.acquired = false
    }
  }

  private async readLock(): Promise<LockInfo | null> {
    try {
      const content = await fs.readFile(this.lockPath, 'utf-8')
      return JSON.parse(content)
    } catch {
      return null
    }
  }

  private async releaseLockFile(): Promise<void> {
    try {
      await fs.unlink(this.lockPath)
    } catch {
      // Ignore errors (file may not exist)
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Execute a function with file lock protection
 */
export async function withLock<T>(
  filePath: string,
  fn: () => Promise<T>
): Promise<T> {
  const lock = new FileLock(filePath)

  const acquired = await lock.acquire()
  if (!acquired) {
    throw new Error(`Failed to acquire lock for ${filePath}`)
  }

  try {
    return await fn()
  } finally {
    await lock.release()
  }
}
