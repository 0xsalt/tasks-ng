# Task Format Specification

**Version:** 2.0.0
**Last Updated:** 2026-01-22

The canonical specification for the PAI task management format. All tools and parsers must conform to this spec.

---

## Overview

Tasks are stored in plain Markdown files using a grep-friendly format with structured metadata. The format prioritizes:

1. **Human readability** — Works in any text editor
2. **Machine parseability** — Consistent patterns for tooling
3. **Grep-friendly** — Prefix-based metadata enables simple filtering
4. **Visual scanning** — Checkbox states show status at a glance

---

## Task Syntax

### Checkbox States

Tasks use checkbox markers to indicate state. This enables visual scanning without parsing metadata.

| Marker | State | Description |
|--------|-------|-------------|
| `[ ]` | Pending | Not started |
| `[/]` | In Progress | Currently being worked on |
| `[x]` | Completed | Done |
| `[-]` | Cancelled | Won't do / no longer relevant |
| `[>]` | Deferred | Postponed to future |
| `[?]` | Blocked | Waiting on external dependency |

**State transitions:**
- `[ ]` → `[/]` → `[x]` (normal flow)
- `[ ]` → `[?]` → `[/]` → `[x]` (blocked then unblocked)
- `[ ]` → `[-]` (cancelled)
- `[ ]` → `[>]` (deferred)

### Basic Structure

```
- [STATE] <description> [metadata...]
```

- `[STATE]` — One of the checkbox markers above
- `<description>` — Free-form task text
- `[metadata...]` — Zero or more metadata tokens (order irrelevant)

### Complete Example

```markdown
- [ ] Review API architecture docs #backend @alice +urgent +important _due:2026-01-15
- [/] Ship authentication feature #work @backend +continuous
- [?] Deploy to production #ops +blocked:security-review
- [x] Design mockups #frontend _done:2026-01-09 _spent:180
```

---

## Metadata Tokens

All metadata uses prefix-based syntax for grep compatibility.

### Tags (`#`)

Categories for filtering and organization.

| Syntax | Purpose |
|--------|---------|
| `#work` | Work-related tasks |
| `#personal` | Personal tasks |
| `#backend` | Backend development |
| `#frontend` | Frontend development |
| `#docs` | Documentation |
| `#tools` | Tooling/CLI work |
| `#research` | Research tasks |

**Rules:**
- Multiple tags allowed per task
- Lowercase, no spaces
- Custom tags permitted

**Grep:** `grep "#work" tasks.md`

---

### Mentions (`@`)

People and project assignments.

| Syntax | Purpose |
|--------|---------|
| `@alice` | Assigned to Alice |
| `@bob` | Assigned to Bob |
| `@projectname` | Links to a project |

**Rules:**
- Multiple mentions allowed
- Use for delegation or project linking
- Lowercase, no spaces

**Grep:** `grep "@alice" tasks.md`

---

### Priority & Modifiers (`+`)

Priority markers and task modifiers. Supports Eisenhower matrix integration.

#### Priority (Eisenhower Matrix)

| Syntax | Meaning | Quadrant |
|--------|---------|----------|
| `+urgent +important` | Do first | Q1 - Crisis |
| `+important` | Schedule | Q2 - Strategic |
| `+urgent` | Delegate | Q3 - Interruption |
| *(neither)* | Consider dropping | Q4 - Noise |

**Rules:**
- `+urgent` and `+important` CAN be combined (this is the design)
- Use for prioritization, not state (state is in checkbox)

#### Modifiers

| Syntax | Meaning |
|--------|---------|
| `+next` | High priority within section |
| `+continuous` | Ongoing/recurring responsibility |
| `+recurring` | Repeats on schedule |
| `+recurring:friday` | Repeats on specific day |
| `+waiting:X` | Blocked on specific dependency |
| `+blocked:X` | Alias for `+waiting:X` |

**Examples:**
```markdown
- [ ] Weekly report #work +recurring:friday
- [?] Deploy to prod #ops +waiting:security-review
- [/] Prompt Security rollout #work +continuous
```

**Grep:** `grep "+urgent" tasks.md` or `grep "+important" tasks.md`

---

### Dates (`_` prefix)

Machine-parseable date metadata.

| Syntax | Purpose | Required |
|--------|---------|----------|
| `_done:YYYY-MM-DD` | Completion date | Yes, on completion |
| `_due:YYYY-MM-DD` | Due date | Optional |
| `_created:YYYY-MM-DD` | Creation date | Optional |

**Rules:**
- Always use ISO 8601 format (YYYY-MM-DD)
- `_done:` is required when marking `[x]`

**Grep:** `grep "_due:" tasks.md`

---

### Time Tracking (`_spent:`)

Minutes spent on a task.

| Syntax | Meaning |
|--------|---------|
| `_spent:30` | 30 minutes spent |
| `_spent:120` | 2 hours spent |
| `_spent:480` | 8 hours (full day) |

**Rules:**
- Always in minutes (enables simple summing)
- Cumulative (update as you work)
- Typically added on completion, but can track incrementally

**Grep:** `grep "_spent:" tasks.md`

---

## File Organization

### Section Structure

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
<!-- Older completed tasks -->
```

### Nesting (Optional)

Tasks can be nested up to **3 levels** using 4-space indentation:

```markdown
- [ ] Larger piece of work #backend
    - [ ] Breakdown item #backend
        - [ ] Fine-grained detail #backend
```

**Rules:**
- Use 4 spaces per level (not tabs)
- Maximum depth: 3 levels
- Most tasks are single-level — use nesting only when breakdown aids clarity
- Each task carries its own metadata (no inheritance from parent)

**Completion semantics:**
- A parent task can only be marked `[x]` when ALL children are `[x]`
- Children can be completed independently
- Tooling should enforce this constraint

**Example:**
```markdown
- [ ] Implement user authentication #backend +inprogress
    - [x] Design auth flow _done:2026-01-08
    - [ ] Create login endpoint
        - [x] Add route handler _done:2026-01-09 _spent:30
        - [ ] Add validation
    - [ ] Create logout endpoint
```

---

## Data Locations

| Path | Purpose |
|------|---------|
| `~/tasks.md` | Primary task file (global) |
| `<project>/tasks.md` | Project-specific tasks |

**Note:** Location is configurable. The global (`~/`) serves as the default hub for cross-project task management.

---

## Workflow Rules

### Adding Tasks
1. Add to appropriate section
2. Include at least one `#tag`
3. Start description with action verb
4. Add `+urgent` and/or `+important` if applicable (Eisenhower)

### Working Tasks
1. Change `[ ]` to `[/]` when starting
2. **Only ONE task `[/]` at a time** (enforces focus)
3. Change back to `[ ]` when pausing

### Blocked Tasks
1. Change to `[?]` when blocked
2. Add `+waiting:dependency` to specify blocker
3. Change back to `[/]` or `[ ]` when unblocked

### Completing Tasks
1. Change to `[x]`
2. Add `_done:YYYY-MM-DD` (required)
3. Add `_spent:N` if tracking time
4. Task stays in place until migration

### Cancelling/Deferring
- `[-]` — Won't do, no longer relevant
- `[>]` — Pushed to future (optionally add note about when)

### Archival
Run migration weekly to move `[x]` and `[-]` tasks to Completed section.

---

## Parsing Notes

For tool implementers:

1. **Token regex patterns:**
   - Tag: `#[a-z0-9-]+`
   - Mention: `@[a-z0-9-]+`
   - Modifier: `\+[a-z]+(?::[a-z0-9-]+)?` (supports `+waiting:dependency`)
   - Date: `_[a-z]+:\d{4}-\d{2}-\d{2}`
   - Time: `_spent:\d+`

2. **Token extraction:** Split on whitespace, match prefixes

3. **Checkbox detection:** Line starts with `- [STATE]` where STATE is one of:
   - ` ` (space) — pending
   - `/` — in progress
   - `x` — completed
   - `-` — cancelled
   - `>` — deferred
   - `?` — blocked

   Regex: `^(\s*)- \[([ /x\->?])\]`

4. **Description extraction:** Text between checkbox and first metadata token

5. **Modifier extraction:** Multiple `+modifier` tokens allowed per task
   - Extract all matches, not just first
   - Handle parameterized modifiers: `+waiting:value`, `+recurring:friday`

6. **Nesting detection:**
   - Count leading spaces: `level = spaces / 4`
   - Level 0: no indent, Level 1: 4 spaces, Level 2: 8 spaces, Level 3: 12 spaces
   - Reject tasks with indent > 12 spaces (max 3 levels)
   - Build parent-child relationships based on level changes

7. **Completion validation:**
   - Before marking parent `[x]`, verify all children are `[x]` or `[-]`
   - Reject completion if any child is `[ ]`, `[/]`, or `[?]`

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2026-01-22 | **Breaking:** Added checkbox state machine (`[/]`, `[-]`, `[>]`, `[?]`). Eisenhower matrix support (`+urgent +important`). New modifiers (`+continuous`, `+waiting:X`, `+next`, `+recurring`). Removed single-status constraint. |
| 1.2.0 | 2026-01-10 | Added 3-level nesting with completion semantics |
| 1.1.0 | 2026-01-10 | Added `@mentions` and `_spent:` time tracking |
| 1.0.0 | 2026-01-09 | Initial specification |
