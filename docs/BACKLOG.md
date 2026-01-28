# BACKLOG.md

> Single source of work.
> Review regularly.
> Top item is next.

---

## NOW

- [ ] Standalone TypeScript parser module (importable, not just CLI)

## BACKLOG

- [ ] Make checkbox icons clickable to cycle states: [ ] → [/] → [x] → [ ] (simple 3-state cycle; consider [-] cancelled as 4th)
- [ ] Investigate optimistic locking for concurrent CRUD writes (design note: rapid parallel inserts can overlap)
- [ ] Deploy updated skill to ~/.claude/skills/tasks/
- [ ] Standalone TypeScript parser module (importable, not just CLI)
- [ ] Validation command (check tasks.md against spec)
- [ ] migrate-completed-tasks.md update for new checkbox states
- [ ] Time tracking summary command (sum _spent: by tag/date)
- [ ] Due date reminder integration (ntfy?)

## ROADMAP

### Web UI - Core Task CRUD
- [ ] Live task list from tasks.md - parse and display with filters
- [ ] Create/edit tasks via form - generate valid format, write back
- [ ] Inline editing - click task to edit in place
- [ ] Drag-drop reordering - move between NOW/BACKLOG/DONE

### Web UI - Visualization
- [ ] Eisenhower matrix view - 4-quadrant visual grid
- [ ] Kanban board - columns by status or section
- [ ] Calendar view - tasks by _due: date
- [ ] Time tracking charts - burndown, time by tag

### Web UI - Mobile/PWA
- [ ] Touch-optimized PWA - offline-first with sync
- [ ] Quick capture widget - add tasks fast on mobile

### Web UI - API Layer
- [ ] WebSocket sync - multi-device real-time

### Web UI - AI-Enhanced
- [ ] Natural language task entry - "Remind me to call Bob Tuesday"
- [ ] Web voice interface - record audio, transcribe to file, process as updates
- [ ] Smart prioritization - suggest Eisenhower quadrant
- [ ] Task decomposition - break down large tasks

### Other
- [ ] Task dependencies (blocked-by relationships)
- [ ] Project-specific task file discovery
- [ ] Integration with private-journal for task completion logging

## DONE

- [x] Go mobile-first PWA with quick capture FAB, bottom nav, responsive layout [2026-01-26]
- [x] Make dashboard dynamic - live data from ~/tasks.md via API [2026-01-26]
- [x] Build CRUD API with parser module, file locking, backup system [2026-01-26]
- [x] Update README for v2.0.0 with checkbox states and features [2026-01-22]
- [x] Bump to v2.0.0 with checkbox states and Eisenhower support [2026-01-22]
- [x] Add CLAUDE.md with branch-only development policy [2026-01-22]
- [x] Update list-tasks.md for new states and Eisenhower display [2026-01-22]
- [x] Fix data location default to ~/tasks.md [2026-01-22]
- [x] Add 3-level nesting with completion semantics [2026-01-10]
- [x] Add @mentions to format spec [2026-01-10]
- [x] Add _spent: time tracking to format spec [2026-01-10]
- [x] Create docs/SPEC.md canonical specification [2026-01-10]
- [x] Initial project setup [2026-01-10]
