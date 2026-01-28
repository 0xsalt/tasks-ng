/**
 * AI-powered task classification
 *
 * Suggests Eisenhower quadrant based on task content
 */

import type { Task, EisenhowerQuadrant } from '@tasks-ng/parser'
import type { CreateTaskInput } from '@tasks-ng/file-ops'

/**
 * Classification suggestion with confidence
 */
export interface ClassificationSuggestion {
  quadrant: EisenhowerQuadrant
  isUrgent: boolean
  isImportant: boolean
  confidence: number
  reasoning: string
}

/**
 * Keywords indicating urgency
 */
const URGENT_KEYWORDS = [
  'asap', 'urgent', 'immediately', 'now', 'today',
  'deadline', 'overdue', 'critical', 'emergency',
  'time-sensitive', 'rush', 'priority'
]

/**
 * Keywords indicating importance
 */
const IMPORTANT_KEYWORDS = [
  'important', 'key', 'strategic', 'goal', 'objective',
  'milestone', 'deliverable', 'stakeholder', 'client',
  'revenue', 'growth', 'security', 'compliance'
]

/**
 * Keywords indicating low priority
 */
const LOW_PRIORITY_KEYWORDS = [
  'someday', 'maybe', 'nice-to-have', 'optional',
  'when possible', 'if time', 'low priority', 'minor'
]

/**
 * Tags that typically indicate importance
 */
const IMPORTANT_TAGS = [
  'work', 'client', 'security', 'compliance', 'revenue',
  'strategic', 'goal', 'milestone'
]

/**
 * Tags that typically indicate urgency
 */
const URGENT_TAGS = [
  'urgent', 'asap', 'today', 'deadline', 'critical'
]

/**
 * Classify a task description
 */
export function classifyTask(
  description: string,
  tags: string[] = [],
  due?: string
): ClassificationSuggestion {
  const lowerDesc = description.toLowerCase()
  const lowerTags = tags.map(t => t.toLowerCase())

  let urgentScore = 0
  let importantScore = 0
  let reasoning: string[] = []

  // Check urgent keywords in description
  for (const keyword of URGENT_KEYWORDS) {
    if (lowerDesc.includes(keyword)) {
      urgentScore += 0.3
      reasoning.push(`contains "${keyword}"`)
    }
  }

  // Check important keywords in description
  for (const keyword of IMPORTANT_KEYWORDS) {
    if (lowerDesc.includes(keyword)) {
      importantScore += 0.3
      reasoning.push(`contains "${keyword}"`)
    }
  }

  // Check low priority keywords (negative signal)
  for (const keyword of LOW_PRIORITY_KEYWORDS) {
    if (lowerDesc.includes(keyword)) {
      urgentScore -= 0.2
      importantScore -= 0.2
      reasoning.push(`contains low-priority indicator "${keyword}"`)
    }
  }

  // Check tags for urgency
  for (const tag of lowerTags) {
    if (URGENT_TAGS.includes(tag)) {
      urgentScore += 0.4
      reasoning.push(`has #${tag} tag`)
    }
  }

  // Check tags for importance
  for (const tag of lowerTags) {
    if (IMPORTANT_TAGS.includes(tag)) {
      importantScore += 0.4
      reasoning.push(`has #${tag} tag`)
    }
  }

  // Due date affects urgency
  if (due) {
    const dueDate = new Date(due)
    const today = new Date()
    const daysUntil = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntil < 0) {
      urgentScore += 0.5
      reasoning.push('overdue')
    } else if (daysUntil <= 1) {
      urgentScore += 0.4
      reasoning.push('due today or tomorrow')
    } else if (daysUntil <= 3) {
      urgentScore += 0.3
      reasoning.push('due within 3 days')
    } else if (daysUntil <= 7) {
      urgentScore += 0.2
      reasoning.push('due within a week')
    }
  }

  // Normalize scores to boolean
  const isUrgent = urgentScore >= 0.3
  const isImportant = importantScore >= 0.3

  // Determine quadrant
  let quadrant: EisenhowerQuadrant
  if (isUrgent && isImportant) {
    quadrant = 'Q1'
  } else if (isImportant && !isUrgent) {
    quadrant = 'Q2'
  } else if (isUrgent && !isImportant) {
    quadrant = 'Q3'
  } else {
    quadrant = 'Q4'
  }

  // Calculate confidence based on signal strength
  const totalSignals = Math.abs(urgentScore) + Math.abs(importantScore)
  const confidence = Math.min(0.3 + totalSignals * 0.2, 0.95)

  return {
    quadrant,
    isUrgent,
    isImportant,
    confidence,
    reasoning: reasoning.length > 0
      ? reasoning.join(', ')
      : 'no strong signals detected'
  }
}

/**
 * Suggest modifiers for a task based on classification
 */
export function suggestModifiers(
  description: string,
  existingModifiers: string[] = [],
  tags: string[] = [],
  due?: string
): string[] {
  const suggestion = classifyTask(description, tags, due)
  const modifiers = [...existingModifiers]

  // Only suggest if confidence is high enough
  if (suggestion.confidence < 0.5) {
    return modifiers
  }

  // Add urgent if suggested and not present
  if (suggestion.isUrgent && !modifiers.includes('urgent')) {
    modifiers.push('urgent')
  }

  // Add important if suggested and not present
  if (suggestion.isImportant && !modifiers.includes('important')) {
    modifiers.push('important')
  }

  return modifiers
}

/**
 * Get quadrant info with AI-generated description
 */
export function getSmartQuadrantInfo(quadrant: EisenhowerQuadrant): {
  name: string
  action: string
  description: string
  emoji: string
} {
  const info = {
    Q1: {
      name: 'Do First',
      action: 'Do immediately',
      description: 'Urgent and important tasks that need immediate attention. These are crises, deadlines, and problems.',
      emoji: '🔥'
    },
    Q2: {
      name: 'Schedule',
      action: 'Plan and schedule',
      description: 'Important but not urgent. These are your goals, planning, and prevention activities. Focus here for long-term success.',
      emoji: '📅'
    },
    Q3: {
      name: 'Delegate',
      action: 'Delegate if possible',
      description: 'Urgent but not important. Interruptions and some meetings. Delegate or minimize these.',
      emoji: '👥'
    },
    Q4: {
      name: 'Eliminate',
      action: 'Consider dropping',
      description: 'Neither urgent nor important. Time wasters and pleasant activities. Limit or eliminate.',
      emoji: '🗑️'
    }
  }

  return info[quadrant]
}

/**
 * Enhance CreateTaskInput with AI suggestions
 */
export function enhanceTaskInput(input: CreateTaskInput): CreateTaskInput & {
  suggestedQuadrant: EisenhowerQuadrant
  classification: ClassificationSuggestion
} {
  const classification = classifyTask(
    input.description,
    input.tags,
    input.due
  )

  const suggestedModifiers = suggestModifiers(
    input.description,
    input.modifiers,
    input.tags,
    input.due
  )

  return {
    ...input,
    modifiers: suggestedModifiers,
    suggestedQuadrant: classification.quadrant,
    classification
  }
}
