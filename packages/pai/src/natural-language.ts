/**
 * Natural language task parsing
 *
 * Converts human-friendly phrases into structured task data
 */

import type { CreateTaskInput } from '@tasks-ng/file-ops'

/**
 * Result of natural language parsing
 */
export interface ParsedNaturalLanguage {
  description: string
  tags: string[]
  mentions: string[]
  modifiers: string[]
  due?: string
  section?: string
  confidence: number // 0-1 confidence score
}

/**
 * Date patterns for natural language
 */
const DATE_PATTERNS: Array<{
  pattern: RegExp
  resolver: (match: RegExpMatchArray) => string
}> = [
  // "today"
  {
    pattern: /\btoday\b/i,
    resolver: () => formatDate(new Date())
  },
  // "tomorrow"
  {
    pattern: /\btomorrow\b/i,
    resolver: () => {
      const d = new Date()
      d.setDate(d.getDate() + 1)
      return formatDate(d)
    }
  },
  // "next week"
  {
    pattern: /\bnext\s+week\b/i,
    resolver: () => {
      const d = new Date()
      d.setDate(d.getDate() + 7)
      return formatDate(d)
    }
  },
  // "next month"
  {
    pattern: /\bnext\s+month\b/i,
    resolver: () => {
      const d = new Date()
      d.setMonth(d.getMonth() + 1)
      return formatDate(d)
    }
  },
  // "on Monday", "on Tuesday", etc.
  {
    pattern: /\bon\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    resolver: (match) => {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const targetDay = dayNames.indexOf(match[1]!.toLowerCase())
      const d = new Date()
      const currentDay = d.getDay()
      const daysUntil = (targetDay - currentDay + 7) % 7 || 7 // Next occurrence
      d.setDate(d.getDate() + daysUntil)
      return formatDate(d)
    }
  },
  // "in X days"
  {
    pattern: /\bin\s+(\d+)\s+days?\b/i,
    resolver: (match) => {
      const d = new Date()
      d.setDate(d.getDate() + parseInt(match[1]!, 10))
      return formatDate(d)
    }
  },
  // "in X weeks"
  {
    pattern: /\bin\s+(\d+)\s+weeks?\b/i,
    resolver: (match) => {
      const d = new Date()
      d.setDate(d.getDate() + parseInt(match[1]!, 10) * 7)
      return formatDate(d)
    }
  },
  // ISO date YYYY-MM-DD
  {
    pattern: /\b(\d{4}-\d{2}-\d{2})\b/,
    resolver: (match) => match[1]!
  }
]

/**
 * Priority/urgency keywords
 */
const URGENCY_PATTERNS = [
  { pattern: /\bASAP\b/i, modifier: 'urgent' },
  { pattern: /\burgent(ly)?\b/i, modifier: 'urgent' },
  { pattern: /\bimmediately\b/i, modifier: 'urgent' },
  { pattern: /\bcritical\b/i, modifier: 'urgent' },
  { pattern: /\bimportant\b/i, modifier: 'important' },
  { pattern: /\bhigh\s*priority\b/i, modifier: 'important' },
  { pattern: /\blow\s*priority\b/i, modifier: 'low' }
]

/**
 * Section inference keywords
 */
const SECTION_PATTERNS = [
  { pattern: /\bright\s+now\b/i, section: 'NOW' },
  { pattern: /\btoday\b/i, section: 'NOW' },
  { pattern: /\blater\b/i, section: 'BACKLOG' },
  { pattern: /\bsomeday\b/i, section: 'BACKLOG' },
  { pattern: /\beventually\b/i, section: 'BACKLOG' }
]

/**
 * Common task prefixes to remove
 */
const TASK_PREFIXES = [
  /^remind\s+me\s+to\s+/i,
  /^i\s+need\s+to\s+/i,
  /^i\s+have\s+to\s+/i,
  /^i\s+should\s+/i,
  /^i\s+must\s+/i,
  /^don't\s+forget\s+to\s+/i,
  /^remember\s+to\s+/i,
  /^make\s+sure\s+to\s+/i,
  /^todo:?\s*/i,
  /^task:?\s*/i
]

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]!
}

/**
 * Parse natural language into task data
 */
export function parseNaturalLanguage(input: string): ParsedNaturalLanguage {
  let text = input.trim()
  let confidence = 0.5 // Base confidence

  // Extract explicit tags (#tag)
  const tags: string[] = []
  text = text.replace(/#(\w+)/g, (_, tag) => {
    tags.push(tag.toLowerCase())
    confidence += 0.1
    return ''
  })

  // Extract explicit mentions (@person)
  const mentions: string[] = []
  text = text.replace(/@(\w+)/g, (_, mention) => {
    mentions.push(mention.toLowerCase())
    confidence += 0.05
    return ''
  })

  // Extract due date
  let due: string | undefined
  for (const { pattern, resolver } of DATE_PATTERNS) {
    const match = text.match(pattern)
    if (match) {
      due = resolver(match)
      text = text.replace(pattern, '')
      confidence += 0.15
      break
    }
  }

  // Extract modifiers (urgent, important)
  const modifiers: string[] = []
  for (const { pattern, modifier } of URGENCY_PATTERNS) {
    if (pattern.test(text)) {
      modifiers.push(modifier)
      text = text.replace(pattern, '')
      confidence += 0.1
    }
  }

  // Infer section
  let section: string | undefined
  for (const { pattern, section: sec } of SECTION_PATTERNS) {
    if (pattern.test(text)) {
      section = sec
      confidence += 0.05
      break
    }
  }

  // Remove common task prefixes
  for (const prefix of TASK_PREFIXES) {
    if (prefix.test(text)) {
      text = text.replace(prefix, '')
      confidence += 0.1
      break
    }
  }

  // Clean up description
  const description = text
    .replace(/\s+/g, ' ')
    .trim()
    // Capitalize first letter
    .replace(/^./, c => c.toUpperCase())

  // Cap confidence at 1.0
  confidence = Math.min(confidence, 1.0)

  return {
    description,
    tags,
    mentions,
    modifiers,
    due,
    section,
    confidence
  }
}

/**
 * Convert natural language to CreateTaskInput
 */
export function naturalLanguageToTask(input: string): CreateTaskInput {
  const parsed = parseNaturalLanguage(input)

  return {
    description: parsed.description,
    tags: parsed.tags,
    mentions: parsed.mentions,
    modifiers: parsed.modifiers,
    due: parsed.due,
    section: parsed.section || 'NOW'
  }
}

/**
 * Check if input looks like natural language (vs structured task format)
 */
export function isNaturalLanguage(input: string): boolean {
  // If it starts with "- [ ]" it's already structured
  if (/^-\s*\[.\]/.test(input.trim())) {
    return false
  }

  // If it contains task prefixes, it's natural language
  for (const prefix of TASK_PREFIXES) {
    if (prefix.test(input)) {
      return true
    }
  }

  // If it contains date phrases, it's natural language
  for (const { pattern } of DATE_PATTERNS) {
    if (pattern.test(input)) {
      return true
    }
  }

  // Default: treat short inputs as natural language
  return input.length < 200
}
