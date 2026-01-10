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
  // Example: join(process.env.HOME!, 'projects/myproject/tasks.md'),
];

interface Task {
  description: string;
  tags: string[];
  status: string | null;
  section: string;
  file: string;
}

function extractTags(line: string): string[] {
  const matches = line.match(/#[\w-]+/g);
  return matches || [];
}

function extractStatus(line: string): string | null {
  const match = line.match(/\+(\w+)/);
  return match ? match[1] : null;
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

    // Parse pending tasks only
    if (line.match(/^- \[ \]/)) {
      const description = line
        .replace(/^- \[ \]/, '')
        .replace(/#[\w-]+/g, '')
        .replace(/\+\w+/g, '')
        .replace(/_\w+:\S+/g, '')
        .trim();

      tasks.push({
        description,
        tags: extractTags(line),
        status: extractStatus(line),
        section: currentSection,
        file: file.split('/').pop() || file
      });
    }
  }

  return tasks;
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
      t.status?.toLowerCase() === filter ||
      t.section.toLowerCase().includes(filter)
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
  console.log('\n📋 Pending Tasks\n');

  if (filteredTasks.length === 0) {
    console.log('✨ No pending tasks found');
    if (filter) console.log(`   Filter: "${filter}"`);
    return;
  }

  for (const [section, tasks] of sections) {
    const urgentCount = tasks.filter(t => t.status === 'urgent').length;
    const inProgressCount = tasks.filter(t => t.status === 'inprogress').length;

    let sectionLabel = `## ${section}`;
    if (urgentCount > 0) sectionLabel += ` 🔥`;
    if (inProgressCount > 0) sectionLabel += ` ⚡`;

    console.log(sectionLabel);

    for (const task of tasks) {
      let prefix = '  ';
      if (task.status === 'urgent') prefix = '🔥';
      else if (task.status === 'inprogress') prefix = '⚡';
      else if (task.status === 'blocked') prefix = '🚫';

      const tags = task.tags.length > 0 ? ` ${task.tags.join(' ')}` : '';
      console.log(`${prefix} ${task.description}${tags}`);
    }
    console.log();
  }

  console.log(`📊 Total: ${filteredTasks.length} pending tasks`);

  const urgent = filteredTasks.filter(t => t.status === 'urgent').length;
  const inProgress = filteredTasks.filter(t => t.status === 'inprogress').length;

  if (urgent > 0) console.log(`🔥 Urgent: ${urgent}`);
  if (inProgress > 0) console.log(`⚡ In Progress: ${inProgress}`);
}

main();
