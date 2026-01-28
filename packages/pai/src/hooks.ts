/**
 * Task lifecycle hooks
 *
 * Fires events on task state changes for PAI integrations
 */

import type { Task, TaskStatus, CheckboxState } from '@tasks-ng/parser'
import { logTaskCompleted, logTaskStarted, logTaskCreated, logTaskCancelled } from './journal.js'
import { hasJournalSkill } from './config.js'

/**
 * Hook event types
 */
export type HookEvent =
  | 'task:created'
  | 'task:updated'
  | 'task:deleted'
  | 'task:started'
  | 'task:completed'
  | 'task:cancelled'
  | 'task:blocked'
  | 'task:unblocked'

/**
 * Hook callback function
 */
export type HookCallback = (event: HookEvent, task: Task, previousState?: Partial<Task>) => void | Promise<void>

/**
 * Registered hooks
 */
const hooks: Map<HookEvent, Set<HookCallback>> = new Map()

/**
 * Register a hook callback
 */
export function registerHook(event: HookEvent, callback: HookCallback): () => void {
  if (!hooks.has(event)) {
    hooks.set(event, new Set())
  }
  hooks.get(event)!.add(callback)

  // Return unregister function
  return () => {
    hooks.get(event)?.delete(callback)
  }
}

/**
 * Register hooks for multiple events
 */
export function registerHooks(
  events: HookEvent[],
  callback: HookCallback
): () => void {
  const unregisters = events.map(event => registerHook(event, callback))
  return () => unregisters.forEach(fn => fn())
}

/**
 * Fire a hook event
 */
export async function fireHook(
  event: HookEvent,
  task: Task,
  previousState?: Partial<Task>
): Promise<void> {
  const callbacks = hooks.get(event)
  if (!callbacks) return

  const promises: Promise<void>[] = []
  for (const callback of callbacks) {
    const result = callback(event, task, previousState)
    if (result instanceof Promise) {
      promises.push(result)
    }
  }

  await Promise.all(promises)
}

/**
 * Determine what hooks to fire based on state change
 */
export function getHooksForStateChange(
  previousState: CheckboxState,
  newState: CheckboxState
): HookEvent[] {
  const events: HookEvent[] = ['task:updated']

  // Started (any state -> in_progress)
  if (newState === '/' && previousState !== '/') {
    events.push('task:started')
  }

  // Completed (any state -> completed)
  if (newState === 'x' && previousState !== 'x') {
    events.push('task:completed')
  }

  // Cancelled (any state -> cancelled)
  if (newState === '-' && previousState !== '-') {
    events.push('task:cancelled')
  }

  // Blocked (any state -> blocked)
  if (newState === '?' && previousState !== '?') {
    events.push('task:blocked')
  }

  // Unblocked (blocked -> any other state)
  if (previousState === '?' && newState !== '?') {
    events.push('task:unblocked')
  }

  return events
}

/**
 * Initialize default PAI hooks
 */
export function initializePAIHooks(): void {
  // Journal integration hooks
  if (hasJournalSkill()) {
    registerHook('task:completed', async (_, task) => {
      await logTaskCompleted(task)
    })

    registerHook('task:started', async (_, task) => {
      await logTaskStarted(task)
    })

    registerHook('task:created', async (_, task) => {
      await logTaskCreated(task)
    })

    registerHook('task:cancelled', async (_, task) => {
      await logTaskCancelled(task)
    })
  }
}

/**
 * Clear all registered hooks (useful for testing)
 */
export function clearHooks(): void {
  hooks.clear()
}

/**
 * Get count of registered hooks for an event
 */
export function getHookCount(event: HookEvent): number {
  return hooks.get(event)?.size || 0
}
