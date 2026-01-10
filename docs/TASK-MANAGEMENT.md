# Task Management Methodology

A practical guide to using the tasks-ng format for daily task management.

---

## Philosophy

Tasks are tracked in `tasks.md` files using plain markdown. This provides:
- **Privacy**: Local files, no external dependencies
- **Portability**: Plain text, works everywhere
- **Searchability**: Grep-friendly metadata format
- **Automation**: Machine-parseable for CLI tooling

---

## File Locations

| Scope | Location | Purpose |
|-------|----------|---------|
| Global | `~/tasks.md` | Cross-project tasks, personal items |
| Project | `<project>/tasks.md` | Project-specific tasks |

---

## Task Format

See `SPEC.md` for the complete format specification.

### Quick Reference
```markdown
- [ ] Task description #tag1 #tag2 +status _due:2026-01-15
- [x] Completed task #tag @person _done:2026-01-09 _spent:45
```

### Metadata Summary
- `#tag` — Categories for filtering
- `@mention` — People or project assignments
- `+status` — Task state (inprogress, urgent, blocked)
- `_date:` — Machine-parseable dates (done, due, created)
- `_spent:` — Time tracking in minutes

---

## Workflow

### Adding Tasks
1. Open `tasks.md`
2. Find or create appropriate section
3. Add task with relevant tags
4. No status prefix needed for new tasks

### Working Tasks
1. Add `+inprogress` when starting
2. Only one task should be `+inprogress` at a time (focus)
3. Remove `+inprogress` if pausing

### Completing Tasks
1. Change `[ ]` to `[x]`
2. Add `_done:YYYY-MM-DD`
3. Optionally add `_spent:N` (minutes)
4. Task stays in original section until migration

### Archival (Weekly)
Run migration to move completed tasks:
```bash
bun migrate-completed-tasks.md
```

---

## File Organization

### Section Structure
Organize by **project/category**, not priority:

```markdown
# Tasks

## [Category Name]
- [ ] Task #tags +status

## [Another Category]
- [ ] Task #tags

## Completed
### Recent (Last 30 Days)
- [x] Task #tags _done:YYYY-MM-DD

### Archive
- [x] Older completed tasks...
```

### Priority Within Sections
Use `+urgent` tag or position (top = higher priority) rather than separate priority sections.

### Nesting (Optional)

Break down larger tasks using 4-space indentation (up to 3 levels):

```markdown
- [ ] Implement auth system #backend
    - [ ] Design auth flow
    - [ ] Create login endpoint
        - [ ] Add route handler
        - [ ] Add validation
    - [ ] Create logout endpoint
```

**Key rules:**
- Most tasks are single-level — nest only when breakdown helps
- Parent can only be `[x]` when all children are `[x]`
- Each task has its own metadata (no inheritance)
- Maximum 3 levels deep

---

## Best Practices

### Task Writing
- **Action-oriented**: Start with verb (Write, Fix, Create, Review)
- **Specific**: Clear enough for future-you to understand
- **Tagged**: Always include at least one category tag
- **Dated on completion**: `_done:` enables history analysis

### Maintenance
- **Daily**: Review tasks.md at session start
- **Weekly**: Run migration to archive completed tasks
- **Monthly**: Clean up stale tasks, review if still relevant

### What NOT to Track Here
- Calendar events (use calendar)
- Recurring habits (use habit tracker)
- Unactionable ideas (use separate notes)

---

## Example Structure

```markdown
# Tasks

## Development
- [ ] Implement user auth #backend +inprogress
    - [x] Design auth flow _done:2026-01-09
    - [ ] Create endpoints
- [ ] Add API rate limiting #backend #security

## Documentation
- [ ] Write API docs #docs
- [ ] Update README #docs

## Research
- [ ] Evaluate caching options #research

## Completed
### Recent (Last 30 Days)
- [x] Deploy v1.0 #backend _done:2026-01-08 _spent:120
- [x] Fix login bug #frontend _done:2026-01-07 _spent:30

### Archive
<!-- Older completed tasks moved here -->
```

---

*See SPEC.md for the complete format specification.*
