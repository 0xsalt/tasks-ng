/**
 * Tests for @tasks-ng/pai
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import {
  isPAIEnvironment,
  hasJournalSkill,
  getPAIConfig,
  parseNaturalLanguage,
  naturalLanguageToTask,
  isNaturalLanguage,
  classifyTask,
  suggestModifiers,
  enhanceTaskInput,
  registerHook,
  fireHook,
  clearHooks,
  getHookCount,
  getHooksForStateChange
} from '../src/index.js'

describe('PAI Config', () => {
  it('detects PAI environment', () => {
    // Should return true if ~/.claude/skills exists
    const isPAI = isPAIEnvironment()
    expect(typeof isPAI).toBe('boolean')
  })

  it('returns PAI config object', () => {
    const config = getPAIConfig()
    expect(config).toHaveProperty('isPAI')
    expect(config).toHaveProperty('claudeDir')
    expect(config).toHaveProperty('skillsDir')
    expect(config).toHaveProperty('h3Dir')
    expect(config).toHaveProperty('hasJournal')
  })
})

describe('Natural Language Parsing', () => {
  it('parses simple task', () => {
    const result = parseNaturalLanguage('call Bob')
    expect(result.description).toBe('Call Bob')
  })

  it('extracts tags', () => {
    const result = parseNaturalLanguage('fix bug #backend #urgent')
    expect(result.description).toBe('Fix bug')
    expect(result.tags).toContain('backend')
    expect(result.tags).toContain('urgent')
  })

  it('extracts mentions', () => {
    const result = parseNaturalLanguage('review PR @alice @bob')
    expect(result.description).toBe('Review PR')
    expect(result.mentions).toContain('alice')
    expect(result.mentions).toContain('bob')
  })

  it('parses "tomorrow"', () => {
    const result = parseNaturalLanguage('call Bob tomorrow')
    expect(result.due).toBeDefined()
    // Should be tomorrow's date
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    expect(result.due).toBe(tomorrow.toISOString().split('T')[0])
  })

  it('parses "next week"', () => {
    const result = parseNaturalLanguage('review docs next week')
    expect(result.due).toBeDefined()
  })

  it('removes task prefixes', () => {
    const result = parseNaturalLanguage('remind me to call Bob')
    expect(result.description).toBe('Call Bob')
    expect(result.confidence).toBeGreaterThan(0.5)
  })

  it('parses "in X days"', () => {
    const result = parseNaturalLanguage('finish report in 3 days')
    expect(result.due).toBeDefined()
  })

  it('detects urgency keywords', () => {
    const result = parseNaturalLanguage('urgent: fix production bug')
    expect(result.modifiers).toContain('urgent')
  })

  it('converts to CreateTaskInput', () => {
    const input = naturalLanguageToTask('remind me to call Bob tomorrow #work')
    expect(input.description).toBe('Call Bob')
    expect(input.tags).toContain('work')
    expect(input.due).toBeDefined()
    expect(input.section).toBe('NOW')
  })
})

describe('Natural Language Detection', () => {
  it('detects structured format', () => {
    expect(isNaturalLanguage('- [ ] Task description')).toBe(false)
    expect(isNaturalLanguage('- [x] Completed task')).toBe(false)
  })

  it('detects natural language with prefixes', () => {
    expect(isNaturalLanguage('remind me to call Bob')).toBe(true)
    expect(isNaturalLanguage("don't forget to send email")).toBe(true)
  })

  it('detects natural language with date phrases', () => {
    expect(isNaturalLanguage('meeting tomorrow')).toBe(true)
    expect(isNaturalLanguage('review next week')).toBe(true)
  })
})

describe('Task Classification', () => {
  it('classifies urgent keywords as Q1 or Q3', () => {
    const result = classifyTask('urgent client meeting', ['work'])
    expect(result.isUrgent).toBe(true)
    expect(['Q1', 'Q3']).toContain(result.quadrant)
  })

  it('classifies important keywords as Q1 or Q2', () => {
    const result = classifyTask('important strategic planning', ['strategic'])
    expect(result.isImportant).toBe(true)
    expect(['Q1', 'Q2']).toContain(result.quadrant)
  })

  it('classifies urgent + important as Q1', () => {
    const result = classifyTask('urgent important deadline', ['urgent', 'work'])
    expect(result.quadrant).toBe('Q1')
    expect(result.isUrgent).toBe(true)
    expect(result.isImportant).toBe(true)
  })

  it('considers due date for urgency', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const due = tomorrow.toISOString().split('T')[0]

    const result = classifyTask('review document', [], due)
    expect(result.isUrgent).toBe(true)
  })

  it('provides reasoning', () => {
    const result = classifyTask('urgent meeting #work', ['work'])
    expect(result.reasoning).toContain('urgent')
  })

  it('handles low priority signals', () => {
    const result = classifyTask('someday maybe organize desk')
    expect(result.quadrant).toBe('Q4')
  })
})

describe('Modifier Suggestions', () => {
  it('suggests urgent for urgent tasks', () => {
    const mods = suggestModifiers('urgent client call', [], ['client'])
    expect(mods).toContain('urgent')
  })

  it('suggests important for important tasks', () => {
    const mods = suggestModifiers('important strategic review', [], ['strategic'])
    expect(mods).toContain('important')
  })

  it('preserves existing modifiers', () => {
    // Use stronger signals to ensure confidence threshold is met
    const mods = suggestModifiers('urgent ASAP client meeting', ['custom'], ['work', 'client'])
    expect(mods).toContain('custom')
    expect(mods).toContain('urgent')
  })
})

describe('Task Enhancement', () => {
  it('enhances task input with classification', () => {
    const enhanced = enhanceTaskInput({
      description: 'urgent client meeting',
      tags: ['work']
    })

    expect(enhanced.suggestedQuadrant).toBeDefined()
    expect(enhanced.classification).toBeDefined()
    expect(enhanced.modifiers).toContain('urgent')
  })
})

describe('Hooks', () => {
  beforeEach(() => {
    clearHooks()
  })

  afterEach(() => {
    clearHooks()
  })

  it('registers and fires hooks', async () => {
    let fired = false
    registerHook('task:completed', () => {
      fired = true
    })

    const mockTask = {
      id: 'test',
      description: 'Test task',
      checkboxState: 'x' as const,
      status: 'completed' as const,
      lineNumber: 1,
      section: 'NOW',
      level: 0,
      tags: [],
      mentions: [],
      modifiers: [],
      dates: {},
      isUrgent: false,
      isImportant: false,
      children: []
    }

    await fireHook('task:completed', mockTask)
    expect(fired).toBe(true)
  })

  it('returns unregister function', () => {
    const unregister = registerHook('task:created', () => {})
    expect(getHookCount('task:created')).toBe(1)

    unregister()
    expect(getHookCount('task:created')).toBe(0)
  })

  it('determines hooks for state changes', () => {
    // Pending to in_progress
    let hooks = getHooksForStateChange(' ', '/')
    expect(hooks).toContain('task:started')
    expect(hooks).toContain('task:updated')

    // In progress to completed
    hooks = getHooksForStateChange('/', 'x')
    expect(hooks).toContain('task:completed')
    expect(hooks).toContain('task:updated')

    // Pending to cancelled
    hooks = getHooksForStateChange(' ', '-')
    expect(hooks).toContain('task:cancelled')
    expect(hooks).toContain('task:updated')

    // Pending to blocked
    hooks = getHooksForStateChange(' ', '?')
    expect(hooks).toContain('task:blocked')

    // Blocked to pending (unblocked)
    hooks = getHooksForStateChange('?', ' ')
    expect(hooks).toContain('task:unblocked')
  })

  it('clears all hooks', () => {
    registerHook('task:created', () => {})
    registerHook('task:completed', () => {})

    clearHooks()

    expect(getHookCount('task:created')).toBe(0)
    expect(getHookCount('task:completed')).toBe(0)
  })
})
