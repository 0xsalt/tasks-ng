/**
 * PAI environment configuration
 *
 * Detects PAI ecosystem and provides configuration paths
 */

import fs from 'fs'
import path from 'path'
import os from 'os'

// PAI standard paths
const CLAUDE_DIR = path.join(os.homedir(), '.claude')
const SKILLS_DIR = path.join(CLAUDE_DIR, 'skills')
const COMMANDS_DIR = path.join(CLAUDE_DIR, 'commands')

/**
 * Check if running within PAI ecosystem
 */
export function isPAIEnvironment(): boolean {
  // Check for .claude directory with skills
  return fs.existsSync(SKILLS_DIR)
}

/**
 * Get PAI skills directory
 */
export function getSkillsDir(): string {
  return SKILLS_DIR
}

/**
 * Get PAI commands directory
 */
export function getCommandsDir(): string {
  return COMMANDS_DIR
}

/**
 * Get path to a specific skill
 */
export function getSkillPath(skillName: string): string | null {
  const skillPath = path.join(SKILLS_DIR, skillName)
  return fs.existsSync(skillPath) ? skillPath : null
}

/**
 * Check if a specific skill is available
 */
export function hasSkill(skillName: string): boolean {
  return getSkillPath(skillName) !== null
}

/**
 * Get H3 directory (PAI data directory)
 */
export function getH3Dir(): string {
  return process.env.H3_DIR || path.join(os.homedir(), 'local', 'h3')
}

/**
 * Get private-journal skill path
 */
export function getJournalSkillPath(): string | null {
  return getSkillPath('private-journal')
}

/**
 * Check if private-journal skill is available
 */
export function hasJournalSkill(): boolean {
  return hasSkill('private-journal')
}

/**
 * PAI configuration object
 */
export interface PAIConfig {
  isPAI: boolean
  claudeDir: string
  skillsDir: string
  commandsDir: string
  h3Dir: string
  hasJournal: boolean
  journalPath: string | null
}

/**
 * Get full PAI configuration
 */
export function getPAIConfig(): PAIConfig {
  return {
    isPAI: isPAIEnvironment(),
    claudeDir: CLAUDE_DIR,
    skillsDir: SKILLS_DIR,
    commandsDir: COMMANDS_DIR,
    h3Dir: getH3Dir(),
    hasJournal: hasJournalSkill(),
    journalPath: getJournalSkillPath()
  }
}
