# tasks-ng

Plain-text task management with grep-friendly metadata.

## What

A task format specification and tooling for managing tasks in Markdown files. Designed for both human editing and machine parsing.

```markdown
## Work

- [ ] Launch user dashboard #frontend @sarah +inprogress
    - [x] Design mockups _done:2026-01-08 _spent:120
    - [ ] Build components #frontend _due:2026-01-20
    - [ ] Write tests #frontend
- [ ] Fix payment timeout bug #backend @ops +urgent _due:2026-01-12
- [x] Deploy monitoring stack #ops @infra _done:2026-01-09 _spent:90

## Personal

- [ ] Research home automation #research
- [x] Renew passport #errands _done:2026-01-05
```

**Format:**
- `#tags` — categorization
- `@mentions` — assignment
- `+status` — state markers (urgent, inprogress, blocked)
- `_due:` / `_done:` — dates
- `_spent:` — time tracking (minutes)
- Nesting — subtasks with 4-space indent

## Status

Format specification is stable. Tooling is in early development.

## Documentation

- [Format Specification](docs/SPEC.md) — Canonical task format reference
- [Task Management](docs/TASK-MANAGEMENT.md) — Methodology and workflows
- [Ideas](docs/IDEAS.md) — Feature proposals under evaluation
- [Inspiration](docs/INSPIRATION.md) — Credits and references

## Roadmap

1. TypeScript/Bun CLI tools (parser, validator)
2. Time tracking summaries
3. Due date reminders
4. Remote CRUD API for mobile access

See [BACKLOG.md](docs/BACKLOG.md) for current work.

## License

MIT
