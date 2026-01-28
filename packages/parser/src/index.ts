/**
 * @tasks-ng/parser
 *
 * Pure TypeScript parser for tasks.md format
 * Zero dependencies - works in any JavaScript runtime
 *
 * @example
 * ```ts
 * import { parseTasksFile, getActiveTasks, groupByQuadrant } from '@tasks-ng/parser'
 *
 * const content = fs.readFileSync('tasks.md', 'utf-8')
 * const { tasks } = parseTasksFile(content)
 *
 * const active = getActiveTasks(tasks)
 * const matrix = groupByQuadrant(active)
 *
 * console.log(`Q1 (Do First): ${matrix.Q1.length} tasks`)
 * ```
 *
 * @packageDocumentation
 */

// Types
export type {
  CheckboxState,
  TaskStatus,
  TaskDates,
  Task,
  EisenhowerQuadrant,
  EisenhowerMatrix,
  ParsedFile,
  BuildTaskLineOptions
} from './types.js'

// Parser
export {
  parseTasksFile,
  parseLine,
  buildTaskTree,
  getTopLevelTasks,
  filterByStatus,
  filterByTags,
  filterBySection,
  getActiveTasks
} from './parser.js'

// Builder
export {
  buildTaskLine,
  taskToLine,
  updateTaskLine,
  replaceTaskLine,
  insertLine,
  deleteLine,
  deleteLines
} from './builder.js'

// Extractors
export {
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
  // Regex patterns for advanced use
  CHECKBOX_REGEX,
  TAG_REGEX,
  MENTION_REGEX,
  MODIFIER_REGEX,
  DATE_REGEX,
  TIME_SPENT_REGEX,
  SECTION_H2_REGEX,
  SECTION_H3_REGEX
} from './extractors.js'

// Eisenhower
export {
  getQuadrant,
  groupByQuadrant,
  filterByQuadrant,
  getQuadrantInfo,
  sortByEisenhower
} from './eisenhower.js'
