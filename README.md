# tasks-ng

Plain-text task management with grep-friendly metadata.

## What

A task format specification and tooling for managing tasks in Markdown files. Designed for both human editing and machine parsing.

```markdown
- [ ] Review API docs #backend @alice +urgent _due:2026-01-15
- [x] Ship auth feature #work _done:2026-01-09 _spent:180
```

**Features:**
- `#tags` for categorization
- `@mentions` for assignment
- `+status` markers (urgent, inprogress, blocked)
- `_metadata` for dates and time tracking
- 3-level nesting with completion semantics

## Status

**Version:** 0.1.0-alpha

Format specification is stable (v1.2.0). Tooling is in early development.

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
