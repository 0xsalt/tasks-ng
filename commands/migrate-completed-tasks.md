#!/usr/bin/env bun

/*
# Migrate Completed Tasks

Scans tasks.md for completed tasks [x] in active sections and migrates them
to the Completed section with proper metadata.

## Usage
```bash
bun ~/.claude/commands/migrate-completed-tasks.md [file]
```

## Examples
- `bun migrate-completed-tasks.md` - Migrate in default ~/tasks.md
- `bun migrate-completed-tasks.md ~/project/tasks.md` - Specify file

## What It Does
1. Finds all [x] tasks in active sections (not already in Completed)
2. Adds _done:YYYY-MM-DD if not present
3. Moves them to "Completed > Recent" section
4. Preserves existing tags and metadata
*/

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const DEFAULT_FILE = join(process.env.HOME!, 'tasks.md');

interface CompletedTask {
  line: string;
  lineNumber: number;
  section: string;
  existingDate: string | null;
}

function extractExistingDate(line: string): string | null {
  const match = line.match(/_done:(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

function findCompletedTasks(content: string): CompletedTask[] {
  const lines = content.split('\n');
  const completed: CompletedTask[] = [];
  let currentSection = '';
  let inCompletedSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track sections
    if (line.startsWith('## ')) {
      currentSection = line.replace('## ', '').trim();
      inCompletedSection = currentSection.toLowerCase().includes('completed');
      continue;
    }
    if (line.startsWith('### ')) {
      const subsection = line.replace('### ', '').trim();
      if (subsection.toLowerCase().includes('recent') ||
          subsection.toLowerCase().includes('archive')) {
        inCompletedSection = true;
      }
      continue;
    }

    // Skip if already in completed section
    if (inCompletedSection) continue;

    // Find completed tasks in active sections
    if (line.match(/^- \[x\]/i)) {
      completed.push({
        line,
        lineNumber: i,
        section: currentSection,
        existingDate: extractExistingDate(line)
      });
    }
  }

  return completed;
}

function addCompletionDate(line: string): string {
  if (line.includes('_done:')) return line;

  const today = new Date().toISOString().split('T')[0];
  return line.trimEnd() + ` _done:${today}`;
}

function migrateCompletedTasks(content: string, tasks: CompletedTask[]): string {
  if (tasks.length === 0) return content;

  const lines = content.split('\n');

  // Remove tasks from original locations (reverse order to preserve indices)
  const sortedTasks = [...tasks].sort((a, b) => b.lineNumber - a.lineNumber);
  for (const task of sortedTasks) {
    lines.splice(task.lineNumber, 1);
  }

  // Find or create Completed section
  let recentIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('### Recent')) {
      recentIndex = i;
      break;
    }
  }

  if (recentIndex === -1) {
    // Find ## Completed section
    let completedIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/^## Completed/i)) {
        completedIndex = i;
        break;
      }
    }

    if (completedIndex === -1) {
      // Create Completed section at end
      lines.push('', '## Completed', '### Recent (Last 30 Days)');
      recentIndex = lines.length - 1;
    } else {
      // Add Recent subsection
      lines.splice(completedIndex + 1, 0, '### Recent (Last 30 Days)');
      recentIndex = completedIndex + 1;
    }
  }

  // Insert migrated tasks after "### Recent" line
  const migratedLines = tasks.map(t => addCompletionDate(t.line));
  lines.splice(recentIndex + 1, 0, ...migratedLines);

  return lines.join('\n');
}

function main() {
  const file = process.argv[2] || DEFAULT_FILE;

  if (!existsSync(file)) {
    console.error(`❌ File not found: ${file}`);
    process.exit(1);
  }

  const content = readFileSync(file, 'utf-8');
  const completedTasks = findCompletedTasks(content);

  if (completedTasks.length === 0) {
    console.log('✨ No completed tasks to migrate - file is clean!');
    return;
  }

  console.log(`🔍 Found ${completedTasks.length} completed task(s) to migrate:\n`);
  completedTasks.forEach((task, i) => {
    const desc = task.line.replace(/^- \[x\]\s*/i, '').substring(0, 60);
    console.log(`   ${i + 1}. ${desc}...`);
    console.log(`      From: ${task.section}`);
  });

  const updated = migrateCompletedTasks(content, completedTasks);
  writeFileSync(file, updated, 'utf-8');

  console.log('\n✅ Migration complete!');
  console.log(`📊 Moved ${completedTasks.length} task(s) to Completed > Recent`);
}

main();
