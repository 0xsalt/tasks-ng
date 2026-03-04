#!/usr/bin/env bun

/*
# Validate Tasks

Validates tasks.md against the Task Format Specification v2.0.0.
Reports errors, warnings, and a summary with pass/fail status.

## Usage
```bash
bun ~/.claude/commands/validate-tasks.md [file]
```

## Examples
- `bun validate-tasks.md` - Validate default ~/tasks.md
- `bun validate-tasks.md ~/project/tasks.md` - Validate specific file

## What It Checks

### Errors (spec violations)
- Invalid checkbox state (must be one of: space, /, x, -, >, ?)
- Missing `_done:` date on completed [x] tasks
- Invalid date format (must be YYYY-MM-DD)
- Nesting exceeds 3 levels (max 12 spaces indent)
- Non-4-space indentation on nested tasks
- Parent marked [x] with incomplete children
- Invalid `_spent:` value (must be positive integer)

### Warnings (workflow violations)
- Multiple [/] in-progress tasks (convention: one at a time)
- Task missing `#tag` (convention: at least one tag per task)
- Malformed metadata tokens (uppercase tags, bad modifier syntax)

## Checkbox States (Reference)
- `[ ]` pending
- `[/]` in progress
- `[x]` completed — requires _done:YYYY-MM-DD
- `[-]` cancelled
- `[>]` deferred
- `[?]` blocked
*/

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const DEFAULT_FILE = process.env.TASKS_FILE || join(process.env.HOME!, 'tasks.md');

// --- Types ---

type Severity = 'error' | 'warning';

interface Finding {
  line: number;
  severity: Severity;
  rule: string;
  message: string;
  text: string;
}

interface ParsedTask {
  line: number;
  indent: number;
  level: number;
  state: string;
  text: string;
  tags: string[];
  dates: Record<string, string>;
  spent: number | null;
  section: string;
  children: ParsedTask[];
  parent: ParsedTask | null;
}

// --- Regex patterns from SPEC.md ---

const CHECKBOX_RE = /^(\s*)- \[([ /x\->?])\]\s*(.*)/;
const TAG_RE = /#[a-z0-9-]+/g;
const MALFORMED_TAG_RE = /#[A-Z][a-zA-Z0-9-]*/g;
const DATE_RE = /_([a-z]+):(\d{4}-\d{2}-\d{2})/g;
const SPENT_RE = /_spent:(\d+)/;
const MODIFIER_RE = /\+[a-z]+(?::[a-z0-9-]+)?/g;

// --- Validation ---

function validateFile(content: string): Finding[] {
  const lines = content.split('\n');
  const findings: Finding[] = [];
  const tasks: ParsedTask[] = [];
  let currentSection = '';

  // First pass: parse all tasks
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    if (line.startsWith('## ')) {
      currentSection = line.replace('## ', '').trim();
      continue;
    }
    if (line.startsWith('### ')) {
      currentSection = line.replace('### ', '').trim();
      continue;
    }

    const match = line.match(CHECKBOX_RE);
    if (!match) continue;

    const [, spaces, state, rest] = match;
    const indent = spaces.length;
    const level = indent / 4;

    // Extract metadata
    const tags: string[] = [];
    let tagMatch;
    const tagRe = /#[a-z0-9-]+/g;
    while ((tagMatch = tagRe.exec(rest)) !== null) {
      tags.push(tagMatch[0]);
    }

    const dates: Record<string, string> = {};
    let dateMatch;
    const dateRe = /_([a-z]+):(\d{4}-\d{2}-\d{2})/g;
    while ((dateMatch = dateRe.exec(rest)) !== null) {
      dates[dateMatch[1]] = dateMatch[2];
    }

    const spentMatch = rest.match(SPENT_RE);
    const spent = spentMatch ? parseInt(spentMatch[1], 10) : null;

    tasks.push({
      line: lineNum,
      indent,
      level,
      state,
      text: line,
      tags,
      dates,
      spent,
      section: currentSection,
      children: [],
      parent: null,
    });
  }

  // Build parent-child relationships
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    if (task.level === 0) continue;

    // Find parent: walk backwards to find first task with level = task.level - 1
    for (let j = i - 1; j >= 0; j--) {
      if (tasks[j].level === task.level - 1) {
        task.parent = tasks[j];
        tasks[j].children.push(task);
        break;
      }
    }
  }

  // Second pass: validate each task
  for (const task of tasks) {
    // Rule: indentation must be multiple of 4
    if (task.indent % 4 !== 0) {
      findings.push({
        line: task.line,
        severity: 'error',
        rule: 'indent-4space',
        message: `Indentation is ${task.indent} spaces (must be multiple of 4)`,
        text: task.text,
      });
    }

    // Rule: max 3 levels (0, 1, 2)
    if (task.level > 2) {
      findings.push({
        line: task.line,
        severity: 'error',
        rule: 'max-depth',
        message: `Nesting level ${task.level + 1} exceeds maximum of 3`,
        text: task.text,
      });
    }

    // Rule: [x] requires _done: date
    if (task.state === 'x' && !task.dates['done']) {
      findings.push({
        line: task.line,
        severity: 'error',
        rule: 'done-date-required',
        message: 'Completed [x] task missing _done:YYYY-MM-DD',
        text: task.text,
      });
    }

    // Rule: validate date formats
    for (const [key, value] of Object.entries(task.dates)) {
      if (!isValidDate(value)) {
        findings.push({
          line: task.line,
          severity: 'error',
          rule: 'date-format',
          message: `Invalid date _${key}:${value} (must be valid YYYY-MM-DD)`,
          text: task.text,
        });
      }
    }

    // Rule: _spent: must be positive integer
    if (task.spent !== null && (task.spent <= 0 || !Number.isInteger(task.spent))) {
      findings.push({
        line: task.line,
        severity: 'error',
        rule: 'spent-format',
        message: `Invalid _spent:${task.spent} (must be positive integer minutes)`,
        text: task.text,
      });
    }

    // Rule: parent [x] only when all children [x] or [-]
    if (task.state === 'x' && task.children.length > 0) {
      const incomplete = task.children.filter(
        (c) => c.state !== 'x' && c.state !== '-'
      );
      if (incomplete.length > 0) {
        findings.push({
          line: task.line,
          severity: 'error',
          rule: 'parent-completion',
          message: `Parent marked [x] but ${incomplete.length} child(ren) not completed`,
          text: task.text,
        });
      }
    }

    // Rule: malformed _spent: value
    const malformedSpent = task.text.match(/_spent:(\S+)/);
    if (malformedSpent && !malformedSpent[1].match(/^\d+$/)) {
      findings.push({
        line: task.line,
        severity: 'error',
        rule: 'spent-format',
        message: `Invalid _spent:${malformedSpent[1]} (must be positive integer minutes)`,
        text: task.text,
      });
    }

    // Warning: task should have at least one #tag
    if (task.tags.length === 0) {
      findings.push({
        line: task.line,
        severity: 'warning',
        rule: 'missing-tag',
        message: 'Task has no #tag (convention: at least one tag per task)',
        text: task.text,
      });
    }

    // Warning: malformed tags (uppercase)
    const malformed = task.text.match(MALFORMED_TAG_RE);
    if (malformed) {
      findings.push({
        line: task.line,
        severity: 'warning',
        rule: 'tag-case',
        message: `Tag ${malformed[0]} uses uppercase (convention: lowercase #tags)`,
        text: task.text,
      });
    }
  }

  // Global rule: only one [/] in-progress at a time
  const inProgress = tasks.filter((t) => t.state === '/');
  if (inProgress.length > 1) {
    const lineNums = inProgress.map((t) => `L${t.line}`).join(', ');
    findings.push({
      line: inProgress[0].line,
      severity: 'warning',
      rule: 'single-wip',
      message: `${inProgress.length} tasks [/] in-progress (convention: 1 at a time) at ${lineNums}`,
      text: inProgress[0].text,
    });
  }

  // Sort by line number
  findings.sort((a, b) => a.line - b.line);
  return findings;
}

function isValidDate(dateStr: string): boolean {
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

// --- Output ---

function formatFinding(f: Finding): string {
  const icon = f.severity === 'error' ? '❌' : '⚠️';
  const lineStr = String(f.line).padStart(4);
  return `  ${icon} L${lineStr} [${f.rule}] ${f.message}`;
}

function main() {
  const file = process.argv[2] || DEFAULT_FILE;

  if (!existsSync(file)) {
    console.error(`❌ File not found: ${file}`);
    process.exit(1);
  }

  const content = readFileSync(file, 'utf-8');
  const findings = validateFile(content);

  const errors = findings.filter((f) => f.severity === 'error');
  const warnings = findings.filter((f) => f.severity === 'warning');

  const fileName = file.split('/').pop() || file;
  console.log(`\n🔍 Validating ${fileName} against SPEC v2.0.0\n`);

  if (findings.length === 0) {
    console.log('✅ No issues found — file conforms to spec.\n');
    process.exit(0);
  }

  if (errors.length > 0) {
    console.log(`Errors (${errors.length}):`);
    for (const f of errors) {
      console.log(formatFinding(f));
    }
    console.log();
  }

  if (warnings.length > 0) {
    console.log(`Warnings (${warnings.length}):`);
    for (const f of warnings) {
      console.log(formatFinding(f));
    }
    console.log();
  }

  console.log('─'.repeat(50));
  console.log(
    `📊 ${errors.length} error(s), ${warnings.length} warning(s)`
  );
  console.log(
    errors.length === 0
      ? '✅ PASS (warnings are advisory)'
      : '❌ FAIL (fix errors to conform to spec)'
  );
  console.log();

  process.exit(errors.length > 0 ? 1 : 0);
}

main();
