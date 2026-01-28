/**
 * @tasks-ng/pai
 *
 * PAI integration for tasks-ng
 * - Journal sync for task completions
 * - Natural language task parsing
 * - AI-powered Eisenhower classification
 * - Lifecycle hooks for PAI integrations
 *
 * @example
 * ```ts
 * import {
 *   isPAIEnvironment,
 *   parseNaturalLanguage,
 *   classifyTask,
 *   initializePAIHooks
 * } from '@tasks-ng/pai'
 *
 * // Check if running in PAI
 * if (isPAIEnvironment()) {
 *   // Initialize hooks for journal sync
 *   initializePAIHooks()
 * }
 *
 * // Parse natural language
 * const parsed = parseNaturalLanguage("remind me to call Bob tomorrow")
 * // { description: "Call Bob", due: "2026-01-28", ... }
 *
 * // Get AI classification
 * const classification = classifyTask("urgent client meeting", ["work"])
 * // { quadrant: "Q1", isUrgent: true, isImportant: true, ... }
 * ```
 *
 * @packageDocumentation
 */

// Config
export {
  isPAIEnvironment,
  getSkillsDir,
  getCommandsDir,
  getSkillPath,
  hasSkill,
  getH3Dir,
  getJournalSkillPath,
  hasJournalSkill,
  getPAIConfig,
  type PAIConfig
} from './config.js'

// Journal
export {
  logToJournal,
  logTaskCompleted,
  logTaskStarted,
  logTaskCreated,
  logTaskCancelled,
  type JournalEntry
} from './journal.js'

// Natural Language
export {
  parseNaturalLanguage,
  naturalLanguageToTask,
  isNaturalLanguage,
  type ParsedNaturalLanguage
} from './natural-language.js'

// Classifier
export {
  classifyTask,
  suggestModifiers,
  getSmartQuadrantInfo,
  enhanceTaskInput,
  type ClassificationSuggestion
} from './classifier.js'

// Hooks
export {
  registerHook,
  registerHooks,
  fireHook,
  getHooksForStateChange,
  initializePAIHooks,
  clearHooks,
  getHookCount,
  type HookEvent,
  type HookCallback
} from './hooks.js'
