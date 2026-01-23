---
name: tasks
description: Task management skill for your DA. USE WHEN user mentions tasks, todos, task list, what needs to be done, add a task, show tasks, mark complete, or any task-related work.
---

# Task Management Skill

Daily task tracking system using plain markdown files with grep-friendly metadata. Install this skill to give your Digital Assistant (DA) the ability to manage tasks in plain-text files.

---

## Quick Reference

| User Says | Action |
|-----------|--------|
| "show tasks" / "what's on my list" | Run `list-tasks.md` |
| "show urgent tasks" | Run `list-tasks.md urgent` |
| "show #work tasks" | Run `list-tasks.md work` |
| "add task: X" | Add to appropriate section in tasks.md |
| "mark X complete" | Change `[ ]` to `[x]`, add `_done:YYYY-MM-DD` |
| "clean up tasks" / "archive" | Run `migrate-completed-tasks.md` |
| "task format" / "how do tasks work" | Explain the format or read TASK-MANAGEMENT.md |

---

## Data Locations

| File | Purpose |
|------|---------|
| `~/tasks.md` | Primary task file (global) |
| `<project>/tasks.md` | Project-specific tasks (when present) |

---

## CLI Tools

Located in `~/.claude/commands/`:

```bash
# List all pending tasks
bun ~/.claude/commands/list-tasks.md

# Filter by tag or status
bun ~/.claude/commands/list-tasks.md work     # #work tagged
bun ~/.claude/commands/list-tasks.md urgent   # +urgent status
bun ~/.claude/commands/list-tasks.md personal # #personal tagged

# Archive completed tasks to Completed section
bun ~/.claude/commands/migrate-completed-tasks.md
```

---

## Task Format

### Checkbox States
```
[ ] pending     [/] in progress     [x] completed
[-] cancelled   [>] deferred        [?] blocked
```

### Basic Structure
```markdown
- [ ] Task description #tag1 #tag2 +urgent +important _due:2026-01-15
- [/] Active task #work +continuous
- [?] Blocked task #ops +waiting:security-review
- [x] Completed task #tag _done:2026-01-09 _spent:45
```

### Metadata

**Tags** (prefix `#`) — Categories for filtering:
- `#work` `#personal` `#pers` `#docs` `#tools` `#research` `#cna` `#pai`

**Mentions** (prefix `@`) — People and projects:
- `@alice` `@bob` — Assign to person
- `@projectname` — Link to project

**Priority** (prefix `+`) — Eisenhower matrix:
- `+urgent +important` — Q1: Do first (crisis)
- `+important` — Q2: Schedule (strategic)
- `+urgent` — Q3: Delegate (interruption)
- *(neither)* — Q4: Consider dropping

**Modifiers** (prefix `+`) — Task attributes:
- `+next` — High priority within section
- `+continuous` — Ongoing responsibility
- `+recurring` / `+recurring:friday` — Repeating task
- `+waiting:X` / `+blocked:X` — Blocked on dependency

**Dates** (prefix `_`) — Machine-parseable:
- `_done:YYYY-MM-DD` — Completion date (required on complete)
- `_due:YYYY-MM-DD` — Due date (optional)

**Time tracking** (prefix `_`) — Minutes spent:
- `_spent:30` — 30 minutes spent on task

---

## Workflow

### Adding Tasks
1. Determine appropriate section in tasks.md
2. Add task with relevant #tags
3. Add `+urgent` and/or `+important` if applicable

### Working Tasks
1. Change `[ ]` to `[/]` when starting
2. Only ONE task `[/]` at a time (focus)
3. Change back to `[ ]` if pausing

### Blocked Tasks
1. Change to `[?]` when blocked
2. Add `+waiting:dependency` to specify blocker

### Completing Tasks
1. Change to `[x]`
2. Add `_done:YYYY-MM-DD`
3. Task stays in section until migration

### Cancelling/Deferring
- `[-]` — Won't do, no longer relevant
- `[>]` — Postponed to future

### Archival (Weekly)
Run `migrate-completed-tasks.md` to move `[x]` and `[-]` tasks to Completed section.

---

## Section Organization

Tasks are organized by **project/category**, not priority:

```markdown
# Tasks

## [Category Name]
- [ ] Task #tags +status
    - [ ] Subtask (optional nesting, up to 3 levels)

## Completed
### Recent (Last 30 Days)
- [x] Task #tags _done:YYYY-MM-DD

### Archive
<!-- Older tasks -->
```

Priority within sections: use `+urgent` or position (top = higher).

Nesting: 4-space indent, max 3 levels. Parent completes only when all children complete.

---

## Common Operations

### Show all pending tasks
```bash
bun ~/.claude/commands/list-tasks.md
```

### Add a new task
Edit `~/tasks.md`, find appropriate section, add:
```markdown
- [ ] New task description #relevant #tags
```

### Mark task complete
Find task, change to:
```markdown
- [x] Task description #tags _done:2026-01-09 _spent:45
```

### Find tasks by keyword
```bash
grep -i "keyword" ~/tasks.md
```

### Find tasks by mention
```bash
grep "@alice" ~/tasks.md
```

### Sum time spent (all completed tasks)
```bash
grep "_spent:" ~/tasks.md | grep -oP '_spent:\d+' | cut -d: -f2 | paste -sd+ | bc
```

---

## Best Practices

- **Action-oriented**: Start with verb (Write, Fix, Create, Review)
- **Tagged**: Always include at least one #tag
- **Dated on completion**: `_done:` enables history analysis
- **One +inprogress**: Focus on one task at a time
- **Weekly cleanup**: Run migration to keep active sections clean
