# tasks-ng

Plain-text task management with grep-friendly metadata.

## What

A task format specification and tooling for managing tasks in Markdown files. Designed for both human editing and machine parsing.

```markdown
## Work

- [ ] Launch user dashboard #frontend +important
    - [x] Design mockups _done:2026-01-08 _spent:120
    - [/] Build components #frontend
    - [ ] Write tests #frontend
- [?] Deploy to production #ops +waiting:security-review
- [x] Deploy monitoring stack #ops _done:2026-01-09 _spent:90

## Personal

- [ ] Research home automation #research
- [>] Learn Rust #learning (deferred to Q2)
- [-] Old project idea #ideas (abandoned)
```

**Checkbox States:**
| Marker | State | Description |
|--------|-------|-------------|
| `[ ]` | Pending | Not started |
| `[/]` | In Progress | Currently working on |
| `[x]` | Completed | Done |
| `[-]` | Abandoned | Won't do |
| `[>]` | Deferred | Postponed |
| `[?]` | Blocked | Waiting on dependency |

**Metadata:**
- `#tags` — categorization
- `@mentions` — assignment
- `+urgent` / `+important` — Eisenhower priority (can combine)
- `+waiting:X` — blocked on specific dependency
- `+continuous` / `+recurring` — ongoing tasks
- `_due:` / `_done:` — dates
- `_spent:` — time tracking (minutes)
- Nesting — subtasks with 4-space indent (max 3 levels)

## Features

- **Checkbox state machine** — Six states for visual scanning without parsing
- **Eisenhower matrix** — `+urgent` and `+important` combine for quadrant priorities
- **Grep-friendly** — All metadata uses consistent prefixes (`#`, `@`, `+`, `_`)
- **Nested subtasks** — Up to 3 levels with parent-child completion rules
- **CLI tooling** — `list-tasks.md` filters by tag, status, or priority

## Status

Format specification v2.0.0 is stable. CLI tooling functional, parser in development.

## For Digital Assistants

See [skill/SKILL.md](skill/SKILL.md) for DA integration. Copy the `skill/` folder to your skills directory.

## Documentation

- [Format Specification](docs/SPEC.md) — Canonical reference
- [Task Management](docs/TASK-MANAGEMENT.md) — Methodology
- [Ideas](docs/IDEAS.md) — Feature proposals
- [Backlog](docs/BACKLOG.md) — Current work

## Roadmap

1. Standalone TypeScript parser module
2. Validation command
3. Time tracking summaries
4. Remote CRUD API for mobile

## License

MIT
