/**
 * @tasks-ng/file-ops
 *
 * File operations for tasks.md format
 * - XDG Base Directory compliant path resolution
 * - Atomic writes with automatic backups
 * - File locking for concurrent access
 * - CRUD operations for tasks
 *
 * @example
 * ```ts
 * import {
 *   readTasksFile,
 *   writeTasksFile,
 *   insertTask,
 *   updateTask,
 *   getTasks
 * } from '@tasks-ng/file-ops'
 *
 * // Read and parse tasks
 * const { tasks } = await readTasksFile()
 *
 * // Insert a new task
 * const task = await insertTask({
 *   description: 'New task',
 *   section: 'NOW',
 *   tags: ['work']
 * })
 *
 * // Update task status
 * await updateTask(task.id, { status: 'in_progress' })
 *
 * // Query with filters
 * const urgent = await getTasks({ tags: ['urgent'] })
 * ```
 *
 * @packageDocumentation
 */

// Path resolution
export {
  resolveTasksFile,
  getBackupDir,
  getXdgDataHome,
  getDefaultTasksFile,
  getLegacyTasksFile,
  fileExists,
  ensureDir
} from './paths.js'

// File lock
export {
  FileLock,
  withLock
} from './file-lock.js'

// File operations
export {
  getTasksFilePath,
  resetTasksFilePath,
  tasksFileExists,
  readTasksFile,
  readTasksFileRaw,
  writeTasksFile,
  listBackups,
  restoreBackup
} from './file-ops.js'

// CRUD operations
export {
  insertTask,
  updateTask,
  deleteTask,
  getTask,
  getTasks,
  getEisenhowerMatrix,
  getSections,
  type CreateTaskInput,
  type UpdateTaskInput,
  type TaskFilters
} from './crud.js'
