/**
 * Task Parser Module for tasks-ng Dashboard
 *
 * This module re-exports from both @tasks-ng/parser (Layer 1)
 * and @tasks-ng/file-ops (Layer 2) packages.
 *
 * Based on SPEC.md v2.0.0
 */

// Re-export everything from the pure parser package (Layer 1)
export {
  // Types
  type CheckboxState,
  type TaskStatus,
  type TaskDates,
  type Task,
  type EisenhowerQuadrant,
  type EisenhowerMatrix,
  type ParsedFile,
  type BuildTaskLineOptions,

  // Parser functions
  parseTasksFile,
  parseLine,
  buildTaskTree,
  getTopLevelTasks,
  filterByStatus,
  filterByTags,
  filterBySection,
  getActiveTasks,

  // Builder functions
  buildTaskLine,
  taskToLine,
  updateTaskLine,
  replaceTaskLine,
  insertLine,
  deleteLine,
  deleteLines,

  // Extractors
  checkboxToStatus,
  statusToCheckbox,
  generateTaskId,
  simpleHash,
  extractTags,
  extractMentions,
  extractModifiers,
  extractDates,
  extractTimeSpent,
  extractDescription,
  getIndentLevel,
  isTaskLine,
  extractCheckboxState,
  CHECKBOX_REGEX,
  TAG_REGEX,
  MENTION_REGEX,
  MODIFIER_REGEX,
  DATE_REGEX,
  TIME_SPENT_REGEX,
  SECTION_H2_REGEX,
  SECTION_H3_REGEX,

  // Eisenhower
  getQuadrant,
  groupByQuadrant,
  filterByQuadrant,
  getQuadrantInfo,
  sortByEisenhower
} from '@tasks-ng/parser'

// Re-export everything from the file operations package (Layer 2)
export {
  // Path resolution
  resolveTasksFile,
  getBackupDir,
  getXdgDataHome,
  getDefaultTasksFile,
  getLegacyTasksFile,
  fileExists,
  ensureDir,

  // File lock
  FileLock,
  withLock,

  // File operations
  getTasksFilePath,
  resetTasksFilePath,
  tasksFileExists,
  readTasksFile,
  readTasksFileRaw,
  writeTasksFile,
  listBackups,
  restoreBackup,

  // CRUD operations
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
} from '@tasks-ng/file-ops'
