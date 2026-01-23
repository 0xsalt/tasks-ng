#!/usr/bin/env bun

/*
# List Tasks

Lists pending tasks from tasks.md files with optional filtering.

## Usage
```bash
bun ~/.claude/commands/list-tasks.md [filter]
```

## Examples
- `bun list-tasks.md` - All pending tasks
- `bun list-tasks.md work` - Tasks tagged #work
- `bun list-tasks.md urgent` - Tasks with +urgent status
- `bun list-tasks.md personal` - Tasks tagged #personal
*/

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const TASK_FILES = [
  join(process.env.HOME!, 'tasks.md'),
  // Add more task files here as needed
];

type CheckboxState = ' ' | '/' | 'x' | '-' | '>' | '?';

interface Task {
  description: string;
  tags: string[];
  modifiers: string[];
  checkboxState: CheckboxState;
  section: string;
  file: string;
  isUrgent: boolean;
  isImportant: boolean;
}

function extractTags(line: string): string[] {
  const matches = line.match(/#[\w-]+/g);
  return matches || [];
}

function extractModifiers(line: string): string[] {
  const matches = line.match(/\+[\w-]+(?::[\w-]+)?/g);
  return matches?.map(m => m.slice(1)) || []; // Remove + prefix
}

function extractCheckboxState(line: string): CheckboxState | null {
  const match = line.match(/^(\s*)- \[([ /x\->?])\]/);
  return match ? (match[2] as CheckboxState) : null;
}

function parseTasks(content: string, file: string): Task[] {
  const lines = content.split('\n');
  const tasks: Task[] = [];
  let currentSection = 'Unsorted';

  for (const line of lines) {
    // Track sections
    if (line.startsWith('## ')) {
      currentSection = line.replace('## ', '').trim();
      continue;
    }
    if (line.startsWith('### ')) {
      currentSection = line.replace('### ', '').trim();
      continue;
    }

    // Stop at Completed section
    if (currentSection.toLowerCase().includes('completed') ||
        currentSection.toLowerCase().includes('archive')) {
      continue;
    }

    // Parse tasks with any checkbox state except completed [x] and cancelled [-]
    const checkboxState = extractCheckboxState(line);
    if (checkboxState && checkboxState !== 'x' && checkboxState !== '-') {
      const description = line
        .replace(/^(\s*)- \[.\]/, '')
        .replace(/#[\w-]+/g, '')
        .replace(/\+[\w-]+(?::[\w-]+)?/g, '')
        .replace(/_\w+:\S+/g, '')
        .replace(/\*\*/g, '') // Remove bold markers
        .trim();

      const modifiers = extractModifiers(line);

      tasks.push({
        description,
        tags: extractTags(line),
        modifiers,
        checkboxState,
        section: currentSection,
        file: file.split('/').pop() || file,
        isUrgent: modifiers.includes('urgent'),
        isImportant: modifiers.includes('important')
      });
    }
  }

  return tasks;
}

function getStateIcon(state: CheckboxState): string {
  switch (state) {
    case ' ': return '  ';  // pending
    case '/': return '⚡';  // in progress
    case '?': return '🚫';  // blocked
    case '>': return '⏸️ ';  // deferred
    default: return '  ';
  }
}

function getEisenhowerIcon(task: Task): string {
  if (task.isUrgent && task.isImportant) return '🔴'; // Q1: Do first
  if (task.isImportant) return '🟡'; // Q2: Schedule
  if (task.isUrgent) return '🟠'; // Q3: Delegate
  return '';  // Q4: Consider dropping
}

function main() {
  const filter = process.argv[2]?.toLowerCase();
  const allTasks: Task[] = [];

  for (const file of TASK_FILES) {
    if (!existsSync(file)) {
      console.error(`Warning: ${file} not found`);
      continue;
    }

    const content = readFileSync(file, 'utf-8');
    const tasks = parseTasks(content, file);
    allTasks.push(...tasks);
  }

  // Apply filter
  let filteredTasks = allTasks;
  if (filter) {
    filteredTasks = allTasks.filter(t =>
      t.tags.some(tag => tag.toLowerCase().includes(filter)) ||
      t.modifiers.some(m => m.toLowerCase().includes(filter)) ||
      t.section.toLowerCase().includes(filter) ||
      (filter === 'urgent' && t.isUrgent) ||
      (filter === 'important' && t.isImportant) ||
      (filter === 'inprogress' && t.checkboxState === '/') ||
      (filter === 'blocked' && t.checkboxState === '?')
    );
  }

  // Group by section
  const sections = new Map<string, Task[]>();
  for (const task of filteredTasks) {
    const key = task.section;
    if (!sections.has(key)) sections.set(key, []);
    sections.get(key)!.push(task);
  }

  // Display
  console.log('\n📋 Active Tasks\n');

  if (filteredTasks.length === 0) {
    console.log('✨ No active tasks found');
    if (filter) console.log(`   Filter: "${filter}"`);
    return;
  }

  for (const [section, tasks] of sections) {
    const q1Count = tasks.filter(t => t.isUrgent && t.isImportant).length;
    const inProgressCount = tasks.filter(t => t.checkboxState === '/').length;
    const blockedCount = tasks.filter(t => t.checkboxState === '?').length;

    let sectionLabel = `## ${section}`;
    if (q1Count > 0) sectionLabel += ` 🔴`;
    if (inProgressCount > 0) sectionLabel += ` ⚡`;
    if (blockedCount > 0) sectionLabel += ` 🚫`;

    console.log(sectionLabel);

    for (const task of tasks) {
      const stateIcon = getStateIcon(task.checkboxState);
      const eisenhowerIcon = getEisenhowerIcon(task);
      const prefix = eisenhowerIcon || stateIcon;

      const tags = task.tags.length > 0 ? ` ${task.tags.join(' ')}` : '';
      console.log(`${prefix} ${task.description}${tags}`);
    }
    console.log();
  }

  console.log(`📊 Total: ${filteredTasks.length} active tasks`);

  const q1 = filteredTasks.filter(t => t.isUrgent && t.isImportant).length;
  const q2 = filteredTasks.filter(t => t.isImportant && !t.isUrgent).length;
  const inProgress = filteredTasks.filter(t => t.checkboxState === '/').length;
  const blocked = filteredTasks.filter(t => t.checkboxState === '?').length;

  if (q1 > 0) console.log(`🔴 Q1 (Urgent+Important): ${q1}`);
  if (q2 > 0) console.log(`🟡 Q2 (Important): ${q2}`);
  if (inProgress > 0) console.log(`⚡ In Progress: ${inProgress}`);
  if (blocked > 0) console.log(`🚫 Blocked: ${blocked}`);
}

main();
