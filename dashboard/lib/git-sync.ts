/**
 * Git-based sync system for tasks-ng
 *
 * Provides multi-device synchronization using Git as the transport layer.
 * Follows "last writer wins + backup" conflict resolution strategy.
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

// ============================================================================
// Types
// ============================================================================

export type SyncStatus =
  | 'synced'       // Up to date with remote
  | 'pending'      // Local changes not pushed
  | 'behind'       // Remote has changes we don't have
  | 'diverged'     // Both local and remote have changes
  | 'syncing'      // Currently syncing
  | 'error'        // Sync error occurred
  | 'no-remote'    // No remote configured

export interface SyncState {
  status: SyncStatus
  lastSync: string | null
  localChanges: number
  remoteChanges: number
  error: string | null
  branch: string | null
  remote: string | null
}

export interface SyncResult {
  success: boolean
  message: string
  conflicts?: string[]
  backupPath?: string
}

// ============================================================================
// Configuration
// ============================================================================

const TASKS_FILE = process.env.TASKS_FILE || path.join(process.env.HOME || '', 'tasks.md')
const REPO_DIR = path.dirname(TASKS_FILE)
const SYNC_STATE_FILE = path.join(REPO_DIR, '.tasks-sync-state.json')
const CONFLICT_BACKUP_DIR = path.join(REPO_DIR, '.sync-conflicts')

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Execute git command in the repo directory
 */
async function git(command: string): Promise<{ stdout: string; stderr: string }> {
  try {
    return await execAsync(`git ${command}`, {
      cwd: REPO_DIR,
      timeout: 30000 // 30 second timeout
    })
  } catch (error: unknown) {
    const execError = error as { stdout?: string; stderr?: string; message?: string }
    // Git sometimes exits with non-zero but has useful output
    if (execError.stdout !== undefined || execError.stderr !== undefined) {
      return {
        stdout: execError.stdout || '',
        stderr: execError.stderr || ''
      }
    }
    throw error
  }
}

/**
 * Check if directory is a git repository
 */
async function isGitRepo(): Promise<boolean> {
  try {
    await git('rev-parse --git-dir')
    return true
  } catch {
    return false
  }
}

/**
 * Get current branch name
 */
async function getCurrentBranch(): Promise<string | null> {
  try {
    const { stdout } = await git('rev-parse --abbrev-ref HEAD')
    return stdout.trim() || null
  } catch {
    return null
  }
}

/**
 * Get configured remote (defaults to 'origin')
 */
async function getRemote(): Promise<string | null> {
  try {
    const { stdout } = await git('remote')
    const remotes = stdout.trim().split('\n').filter(Boolean)
    return remotes.includes('origin') ? 'origin' : remotes[0] || null
  } catch {
    return null
  }
}

/**
 * Check if there are local uncommitted changes
 */
async function hasLocalChanges(): Promise<boolean> {
  try {
    const { stdout } = await git('status --porcelain')
    return stdout.trim().length > 0
  } catch {
    return false
  }
}

/**
 * Count local commits not pushed to remote
 */
async function countLocalCommits(remote: string, branch: string): Promise<number> {
  try {
    const { stdout } = await git(`rev-list ${remote}/${branch}..HEAD --count`)
    return parseInt(stdout.trim(), 10) || 0
  } catch {
    return 0
  }
}

/**
 * Count remote commits not pulled locally
 */
async function countRemoteCommits(remote: string, branch: string): Promise<number> {
  try {
    const { stdout } = await git(`rev-list HEAD..${remote}/${branch} --count`)
    return parseInt(stdout.trim(), 10) || 0
  } catch {
    return 0
  }
}

/**
 * Read sync state from file
 */
async function readSyncState(): Promise<Partial<SyncState>> {
  try {
    const content = await fs.readFile(SYNC_STATE_FILE, 'utf-8')
    return JSON.parse(content)
  } catch {
    return {}
  }
}

/**
 * Write sync state to file
 */
async function writeSyncState(state: Partial<SyncState>): Promise<void> {
  const existing = await readSyncState()
  const merged = { ...existing, ...state }
  await fs.writeFile(SYNC_STATE_FILE, JSON.stringify(merged, null, 2))
}

/**
 * Create backup of conflicting file
 */
async function createConflictBackup(filename: string): Promise<string> {
  await fs.mkdir(CONFLICT_BACKUP_DIR, { recursive: true })

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const basename = path.basename(filename)
  const backupName = `${basename}.conflict-${timestamp}`
  const backupPath = path.join(CONFLICT_BACKUP_DIR, backupName)

  try {
    const content = await fs.readFile(path.join(REPO_DIR, filename), 'utf-8')
    await fs.writeFile(backupPath, content)
  } catch {
    // File may not exist locally
  }

  return backupPath
}

// ============================================================================
// Main Sync Functions
// ============================================================================

/**
 * Get current sync status
 */
export async function getSyncStatus(): Promise<SyncState> {
  const state: SyncState = {
    status: 'error',
    lastSync: null,
    localChanges: 0,
    remoteChanges: 0,
    error: null,
    branch: null,
    remote: null
  }

  try {
    // Check if git repo
    if (!await isGitRepo()) {
      state.status = 'no-remote'
      state.error = 'Not a git repository'
      return state
    }

    state.branch = await getCurrentBranch()
    state.remote = await getRemote()

    if (!state.remote) {
      state.status = 'no-remote'
      state.error = 'No remote configured'
      return state
    }

    // Fetch to get latest remote state (without merging)
    try {
      await git(`fetch ${state.remote}`)
    } catch {
      // Fetch failed, but we can still report local state
    }

    // Count changes
    if (state.branch && state.remote) {
      state.localChanges = await countLocalCommits(state.remote, state.branch)
      state.remoteChanges = await countRemoteCommits(state.remote, state.branch)
    }

    // Check for uncommitted changes
    const hasUncommitted = await hasLocalChanges()
    if (hasUncommitted) {
      state.localChanges++
    }

    // Determine status
    if (state.localChanges > 0 && state.remoteChanges > 0) {
      state.status = 'diverged'
    } else if (state.localChanges > 0) {
      state.status = 'pending'
    } else if (state.remoteChanges > 0) {
      state.status = 'behind'
    } else {
      state.status = 'synced'
    }

    // Read last sync time
    const savedState = await readSyncState()
    state.lastSync = savedState.lastSync || null

  } catch (error) {
    state.error = error instanceof Error ? error.message : 'Unknown error'
  }

  return state
}

/**
 * Pull changes from remote
 */
export async function pullChanges(): Promise<SyncResult> {
  try {
    const status = await getSyncStatus()

    if (status.status === 'no-remote') {
      return { success: false, message: 'No remote configured' }
    }

    if (!status.remote || !status.branch) {
      return { success: false, message: 'Could not determine remote or branch' }
    }

    // Check for local uncommitted changes
    const hasUncommitted = await hasLocalChanges()
    let backupPath: string | undefined

    if (hasUncommitted) {
      // Stash local changes before pulling
      const tasksFilename = path.basename(TASKS_FILE)
      backupPath = await createConflictBackup(tasksFilename)

      // Stash or reset - we'll use stash to be safe
      await git('stash push -m "Auto-stash before sync"')
    }

    // Pull with rebase
    try {
      await git(`pull --rebase ${status.remote} ${status.branch}`)
    } catch (pullError) {
      // If rebase failed, abort and restore
      try {
        await git('rebase --abort')
      } catch {
        // May not be in rebase state
      }

      if (hasUncommitted) {
        try {
          await git('stash pop')
        } catch {
          // Stash pop may conflict
        }
      }

      return {
        success: false,
        message: 'Pull failed - conflicts detected',
        backupPath
      }
    }

    // Restore stashed changes
    if (hasUncommitted) {
      try {
        await git('stash pop')
      } catch {
        // Stash pop conflict - local changes couldn't be applied
        return {
          success: true,
          message: 'Pulled changes but local changes could not be merged. Backup saved.',
          backupPath
        }
      }
    }

    // Update last sync time
    await writeSyncState({ lastSync: new Date().toISOString() })

    return {
      success: true,
      message: 'Successfully pulled changes'
    }

  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Pull failed'
    }
  }
}

/**
 * Push local changes to remote
 */
export async function pushChanges(commitMessage?: string): Promise<SyncResult> {
  try {
    const status = await getSyncStatus()

    if (status.status === 'no-remote') {
      return { success: false, message: 'No remote configured' }
    }

    if (!status.remote || !status.branch) {
      return { success: false, message: 'Could not determine remote or branch' }
    }

    // Check for uncommitted changes
    const hasUncommitted = await hasLocalChanges()

    if (hasUncommitted) {
      // Stage and commit
      const message = commitMessage || `Sync: ${new Date().toISOString()}`
      await git('add -A')
      await git(`commit -m "${message.replace(/"/g, '\\"')}"`)
    }

    // Push
    try {
      await git(`push ${status.remote} ${status.branch}`)
    } catch (pushError) {
      // Push failed - likely need to pull first
      return {
        success: false,
        message: 'Push failed - remote has changes. Pull first.'
      }
    }

    // Update last sync time
    await writeSyncState({ lastSync: new Date().toISOString() })

    return {
      success: true,
      message: 'Successfully pushed changes'
    }

  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Push failed'
    }
  }
}

/**
 * Full sync: pull then push
 */
export async function sync(commitMessage?: string): Promise<SyncResult> {
  try {
    // First, pull
    const pullResult = await pullChanges()
    if (!pullResult.success) {
      return pullResult
    }

    // Then, push any local changes
    const pushResult = await pushChanges(commitMessage)
    if (!pushResult.success) {
      return pushResult
    }

    return {
      success: true,
      message: 'Sync complete'
    }

  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Sync failed'
    }
  }
}

/**
 * Initialize sync for a repo that doesn't have a remote
 */
export async function initSync(remoteUrl: string): Promise<SyncResult> {
  try {
    if (!await isGitRepo()) {
      // Initialize git repo
      await git('init')
    }

    // Check if origin already exists
    const existingRemote = await getRemote()
    if (existingRemote === 'origin') {
      // Update existing remote
      await git(`remote set-url origin ${remoteUrl}`)
    } else {
      // Add remote
      await git(`remote add origin ${remoteUrl}`)
    }

    return {
      success: true,
      message: 'Sync initialized with remote'
    }

  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Init failed'
    }
  }
}
