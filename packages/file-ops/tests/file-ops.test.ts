/**
 * Tests for @tasks-ng/file-ops
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import {
  resolveTasksFile,
  getBackupDir,
  getXdgDataHome,
  getDefaultTasksFile,
  getLegacyTasksFile,
  fileExists
} from '../src/paths.js'
import { FileLock, withLock } from '../src/file-lock.js'

// Test file location
const TEST_DIR = path.join(os.tmpdir(), 'tasks-ng-test-' + Date.now())
const TEST_FILE = path.join(TEST_DIR, 'test-tasks.md')

describe('Path Resolution', () => {
  it('returns XDG data home path', () => {
    const xdgPath = getXdgDataHome()
    expect(xdgPath).toContain('.local/share')
  })

  it('returns default tasks file path', () => {
    const defaultPath = getDefaultTasksFile()
    expect(defaultPath).toContain('tasks-ng/tasks.md')
  })

  it('returns legacy tasks file path', () => {
    const legacyPath = getLegacyTasksFile()
    expect(legacyPath).toContain('tasks.md')
    expect(legacyPath).not.toContain('tasks-ng')
  })

  it('resolves backup directory', () => {
    const backupDir = getBackupDir('/home/user/tasks.md')
    expect(backupDir).toBe('/home/user/.task-backups')
  })

  it('checks file existence correctly', () => {
    expect(fileExists('/nonexistent/file.md')).toBe(false)
    expect(fileExists(process.cwd())).toBe(true) // Current dir exists
  })
})

describe('FileLock', () => {
  beforeEach(async () => {
    await fs.mkdir(TEST_DIR, { recursive: true })
    await fs.writeFile(TEST_FILE, '# Test\n')
  })

  afterEach(async () => {
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  it('acquires and releases lock', async () => {
    const lock = new FileLock(TEST_FILE)

    const acquired = await lock.acquire()
    expect(acquired).toBe(true)

    // Lock file should exist
    const lockPath = path.join(TEST_DIR, '.test-tasks.md.lock')
    expect(fileExists(lockPath)).toBe(true)

    await lock.release()

    // Lock file should be removed
    expect(fileExists(lockPath)).toBe(false)
  })

  it('withLock executes function safely', async () => {
    let executed = false

    await withLock(TEST_FILE, async () => {
      executed = true
    })

    expect(executed).toBe(true)
  })

  it('withLock returns function result', async () => {
    const result = await withLock(TEST_FILE, async () => {
      return 42
    })

    expect(result).toBe(42)
  })

  it('withLock releases lock even on error', async () => {
    const lockPath = path.join(TEST_DIR, '.test-tasks.md.lock')

    try {
      await withLock(TEST_FILE, async () => {
        throw new Error('Test error')
      })
    } catch {
      // Expected
    }

    // Lock should be released
    expect(fileExists(lockPath)).toBe(false)
  })
})

describe('Path Environment Override', () => {
  const originalEnv = process.env.TASKS_FILE

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.TASKS_FILE = originalEnv
    } else {
      delete process.env.TASKS_FILE
    }
  })

  it('respects TASKS_FILE environment variable', () => {
    process.env.TASKS_FILE = '/custom/path/tasks.md'
    const resolved = resolveTasksFile()
    expect(resolved).toBe('/custom/path/tasks.md')
  })
})
