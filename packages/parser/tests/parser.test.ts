/**
 * Tests for @tasks-ng/parser
 */

import { describe, it, expect } from 'bun:test'
import {
  parseTasksFile,
  parseLine,
  buildTaskLine,
  taskToLine,
  getQuadrant,
  groupByQuadrant,
  checkboxToStatus,
  statusToCheckbox,
  extractTags,
  extractMentions,
  extractModifiers,
  extractDates,
  extractTimeSpent,
  getActiveTasks,
  filterByTags,
  filterBySection
} from '../src/index.js'

describe('Checkbox State Mapping', () => {
  it('maps all checkbox states to status', () => {
    expect(checkboxToStatus(' ')).toBe('pending')
    expect(checkboxToStatus('/')).toBe('in_progress')
    expect(checkboxToStatus('x')).toBe('completed')
    expect(checkboxToStatus('-')).toBe('cancelled')
    expect(checkboxToStatus('>')).toBe('deferred')
    expect(checkboxToStatus('?')).toBe('blocked')
  })

  it('maps all statuses to checkbox states', () => {
    expect(statusToCheckbox('pending')).toBe(' ')
    expect(statusToCheckbox('in_progress')).toBe('/')
    expect(statusToCheckbox('completed')).toBe('x')
    expect(statusToCheckbox('cancelled')).toBe('-')
    expect(statusToCheckbox('deferred')).toBe('>')
    expect(statusToCheckbox('blocked')).toBe('?')
  })
})

describe('Extractors', () => {
  it('extracts tags', () => {
    expect(extractTags('Task #backend #api')).toEqual(['backend', 'api'])
    expect(extractTags('No tags here')).toEqual([])
  })

  it('extracts mentions', () => {
    expect(extractMentions('Task @alice @bob')).toEqual(['alice', 'bob'])
    expect(extractMentions('No mentions')).toEqual([])
  })

  it('extracts modifiers', () => {
    expect(extractModifiers('Task +urgent +important')).toEqual(['urgent', 'important'])
    expect(extractModifiers('Task +waiting:review')).toEqual(['waiting:review'])
  })

  it('extracts dates', () => {
    const dates = extractDates('Task _due:2026-01-15 _done:2026-01-20')
    expect(dates.due).toBe('2026-01-15')
    expect(dates.done).toBe('2026-01-20')
  })

  it('extracts time spent', () => {
    expect(extractTimeSpent('Task _spent:120')).toBe(120)
    expect(extractTimeSpent('No time')).toBeUndefined()
  })
})

describe('parseLine', () => {
  it('parses a simple task', () => {
    const task = parseLine('- [ ] Simple task', 1, 'NOW')
    expect(task).not.toBeNull()
    expect(task!.description).toBe('Simple task')
    expect(task!.checkboxState).toBe(' ')
    expect(task!.status).toBe('pending')
    expect(task!.section).toBe('NOW')
  })

  it('parses a task with metadata', () => {
    const task = parseLine('- [/] Working on API #backend @alice +urgent _due:2026-01-20', 5, 'BACKLOG')
    expect(task).not.toBeNull()
    expect(task!.description).toBe('Working on API')
    expect(task!.checkboxState).toBe('/')
    expect(task!.status).toBe('in_progress')
    expect(task!.tags).toEqual(['backend'])
    expect(task!.mentions).toEqual(['alice'])
    expect(task!.modifiers).toContain('urgent')
    expect(task!.isUrgent).toBe(true)
    expect(task!.dates.due).toBe('2026-01-20')
  })

  it('parses nested tasks', () => {
    const task = parseLine('    - [ ] Nested task', 3, 'NOW')
    expect(task).not.toBeNull()
    expect(task!.level).toBe(1)
  })

  it('returns null for non-task lines', () => {
    expect(parseLine('## Section', 1, 'NOW')).toBeNull()
    expect(parseLine('Regular text', 1, 'NOW')).toBeNull()
  })

  it('rejects tasks nested too deep', () => {
    // 16 spaces = level 4, exceeds max of 3
    expect(parseLine('                - [ ] Too deep', 1, 'NOW')).toBeNull()
  })
})

describe('parseTasksFile', () => {
  const sampleContent = `# Tasks

## NOW

- [ ] First task #tools
- [/] In progress task #backend +urgent

## BACKLOG

- [ ] Backlog item #frontend
    - [ ] Subtask one
    - [ ] Subtask two

## DONE

- [x] Completed task #docs _done:2026-01-15
`

  it('parses all tasks', () => {
    const { tasks } = parseTasksFile(sampleContent)
    expect(tasks.length).toBe(6)
  })

  it('extracts sections', () => {
    const { sections } = parseTasksFile(sampleContent)
    expect(sections).toContain('NOW')
    expect(sections).toContain('BACKLOG')
    expect(sections).toContain('DONE')
  })

  it('builds parent-child relationships', () => {
    const { tasks } = parseTasksFile(sampleContent)
    const backlogItem = tasks.find(t => t.description === 'Backlog item')
    expect(backlogItem).toBeDefined()
    expect(backlogItem!.children.length).toBe(2)

    const subtask = tasks.find(t => t.description === 'Subtask one')
    expect(subtask).toBeDefined()
    expect(subtask!.parentId).toBe(backlogItem!.id)
  })

  it('preserves original content', () => {
    const { rawContent, lines } = parseTasksFile(sampleContent)
    expect(rawContent).toBe(sampleContent)
    expect(lines.length).toBeGreaterThan(0)
  })
})

describe('buildTaskLine', () => {
  it('builds a simple task line', () => {
    const line = buildTaskLine({ description: 'Simple task' })
    expect(line).toBe('- [ ] Simple task')
  })

  it('builds a task with all metadata', () => {
    const line = buildTaskLine({
      description: 'Full task',
      checkboxState: 'x',
      tags: ['backend'],
      mentions: ['alice'],
      modifiers: ['urgent'],
      dates: { done: '2026-01-15' },
      timeSpent: 60
    })
    expect(line).toContain('- [x]')
    expect(line).toContain('Full task')
    expect(line).toContain('#backend')
    expect(line).toContain('@alice')
    expect(line).toContain('+urgent')
    expect(line).toContain('_done:2026-01-15')
    expect(line).toContain('_spent:60')
  })

  it('builds nested tasks with proper indentation', () => {
    const line = buildTaskLine({ description: 'Nested', level: 2 })
    expect(line).toBe('        - [ ] Nested')
  })
})

describe('Round-trip parsing', () => {
  it('taskToLine preserves task data', () => {
    const original = '- [/] Working task #backend @bob +important _due:2026-02-01'
    const task = parseLine(original, 1, 'NOW')
    expect(task).not.toBeNull()

    const rebuilt = taskToLine(task!)
    const reparsed = parseLine(rebuilt, 1, 'NOW')

    expect(reparsed!.description).toBe(task!.description)
    expect(reparsed!.checkboxState).toBe(task!.checkboxState)
    expect(reparsed!.tags).toEqual(task!.tags)
    expect(reparsed!.mentions).toEqual(task!.mentions)
    expect(reparsed!.isImportant).toBe(task!.isImportant)
    expect(reparsed!.dates.due).toBe(task!.dates.due)
  })
})

describe('Eisenhower Matrix', () => {
  it('classifies quadrants correctly', () => {
    const tasks = [
      parseLine('- [ ] Q1 task +urgent +important', 1, 'NOW')!,
      parseLine('- [ ] Q2 task +important', 2, 'NOW')!,
      parseLine('- [ ] Q3 task +urgent', 3, 'NOW')!,
      parseLine('- [ ] Q4 task', 4, 'NOW')!
    ]

    expect(getQuadrant(tasks[0])).toBe('Q1')
    expect(getQuadrant(tasks[1])).toBe('Q2')
    expect(getQuadrant(tasks[2])).toBe('Q3')
    expect(getQuadrant(tasks[3])).toBe('Q4')
  })

  it('groups by quadrant', () => {
    const tasks = [
      parseLine('- [ ] Q1 task +urgent +important', 1, 'NOW')!,
      parseLine('- [ ] Q2 task +important', 2, 'NOW')!,
      parseLine('- [ ] Q3 task +urgent', 3, 'NOW')!,
      parseLine('- [ ] Another Q2 +important', 4, 'NOW')!
    ]

    const matrix = groupByQuadrant(tasks)
    expect(matrix.Q1.length).toBe(1)
    expect(matrix.Q2.length).toBe(2)
    expect(matrix.Q3.length).toBe(1)
    expect(matrix.Q4.length).toBe(0)
  })
})

describe('Filters', () => {
  const content = `## NOW
- [ ] Active #backend
- [/] In progress #frontend
- [x] Done #backend _done:2026-01-15
- [-] Cancelled #frontend
`

  it('getActiveTasks excludes completed and cancelled', () => {
    const { tasks } = parseTasksFile(content)
    const active = getActiveTasks(tasks)
    expect(active.length).toBe(2)
    expect(active.every(t => t.status !== 'completed' && t.status !== 'cancelled')).toBe(true)
  })

  it('filterByTags finds matching tasks', () => {
    const { tasks } = parseTasksFile(content)
    const backend = filterByTags(tasks, ['backend'])
    expect(backend.length).toBe(2)
  })

  it('filterBySection finds tasks in section', () => {
    const { tasks } = parseTasksFile(content)
    const now = filterBySection(tasks, 'NOW')
    expect(now.length).toBe(4)
  })
})
