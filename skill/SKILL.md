---
name: tasks
description: Task management system for Chris and Poe. USE WHEN user mentions tasks, todos, task list, what needs to be done, add a task, show tasks, mark complete, or any task-related work.
---

# Task Management Skill

Daily task tracking system using plain markdown files with grep-friendly metadata.

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
| `~/tasks.md` | Primary task file (global/cross-project) |
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

### Basic Structure
```markdown
- [ ] Task description #tag1 #tag2 @person +status _due:2026-01-15
- [x] Completed task #tag @alice _done:2026-01-09 _spent:45
```

### Metadata

**Tags** (prefix `#`) — Categories for filtering:
- `#work` `#personal` `#docs` `#tools` `#research` `#backend` `#frontend`

**Mentions** (prefix `@`) — People and projects:
- `@alice` `@bob` — Assign to person
- `@projectname` — Link to project (e.g., `@backend`, `@frontend`)

**Status** (prefix `+`) — One per task:
- `+inprogress` — Currently working on
- `+urgent` — Needs immediate attention
- `+blocked` — Waiting on external dependency

**Dates** (prefix `_`) — Machine-parseable:
- `_done:YYYY-MM-DD` — Completion date (required on complete)
- `_due:YYYY-MM-DD` — Due date (optional)
- `_created:YYYY-MM-DD` — Creation date (optional)

**Time tracking** (prefix `_`) — Minutes spent:
- `_spent:30` — 30 minutes spent on task
- `_spent:120` — 2 hours (always in minutes for easy summing)

---

## Workflow

### Adding Tasks
1. Determine appropriate section in tasks.md
2. Add task with relevant #tags
3. No +status needed for new tasks

### Working Tasks
1. Add `+inprogress` when starting
2. Only ONE task should be `+inprogress` at a time (focus)
3. Remove `+inprogress` if pausing

### Completing Tasks
1. Change `[ ]` to `[x]`
2. Add `_done:YYYY-MM-DD`
3. Task stays in section until migration

### Archival (Weekly)
Run `migrate-completed-tasks.md` to move `[x]` tasks to Completed section.

---

## Section Organization

Tasks are organized by **project/category**, not priority:

```markdown
# Tasks

## [Category Name]
- [ ] Task #tags +status

## Completed
### Recent (Last 30 Days)
- [x] Task #tags _done:YYYY-MM-DD

### Archive
<!-- Older tasks -->
```

Priority within sections: use `+urgent` or position (top = higher).

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
