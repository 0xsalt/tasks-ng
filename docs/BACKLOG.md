# BACKLOG.md

> Single source of work.
> Review regularly.
> Top item is next.

---

## NOW

- [ ] Make checkbox icons clickable to cycle states: [ ] → [/] → [x] → [ ] (simple 3-state cycle; consider [-] cancelled as 4th) #frontend

## BACKLOG
- [ ] Light/Dark/Auto mode toggle - implement same pattern as ~/local/projects/whereis-emmy/ #frontend #ui
- [ ] Settings page: Toggle for single-task-in-progress enforcement (currently allows multiple [/] tasks, make it optional) #frontend #settings
- [ ] Investigate optimistic locking for concurrent CRUD writes (design note: rapid parallel inserts can overlap) #backend
- [ ] Deploy updated skill to ~/.claude/skills/tasks/ #tools
- [ ] Validation command (check tasks.md against spec) #tools
- [ ] migrate-completed-tasks.md update for new checkbox states #docs
- [ ] Time tracking summary command (sum _spent: by tag/date) #tools
- [ ] Due date reminder integration (ntfy?) #tools

## ROADMAP

### Web UI - Core Task CRUD
- [ ] Live task list from tasks.md - parse and display with filters #frontend
- [ ] Create/edit tasks via form - generate valid format, write back #frontend
- [ ] Inline editing - click task to edit in place #frontend
- [ ] Drag-drop reordering - move between NOW/BACKLOG/DONE #frontend

### Web UI - Visualization
- [ ] Eisenhower matrix view - 4-quadrant visual grid #frontend
- [ ] Kanban board - columns by status or section #frontend
- [ ] Calendar view - tasks by _due: date #frontend
- [ ] Time tracking charts - burndown, time by tag #frontend

### Web UI - Mobile/PWA
- [ ] Touch-optimized PWA - offline-first with sync #frontend
- [ ] Quick capture widget - add tasks fast on mobile #frontend

### Web UI - API Layer
- [ ] WebSocket sync - multi-device real-time #backend

### Web UI - AI-Enhanced
- [ ] Natural language task entry - "Remind me to call Bob Tuesday" #ai
- [ ] Web voice interface - record audio, transcribe to file, process as updates #ai
- [ ] Smart prioritization - suggest Eisenhower quadrant #ai
- [ ] Task decomposition - break down large tasks #ai

### Other
- [ ] Task dependencies (blocked-by relationships) #tools
- [ ] Project-specific task file discovery #tools
- [ ] Integration with private-journal for task completion logging #tools

## DONE

- [x] 003: Parser Layer 3 - PAI integration module with AI features, journal sync #tools +pai _done:2026-01-27
- [x] 002: Parser Layer 2 - File operations module with locking, backup, XDG paths #tools _done:2026-01-27
- [x] 001: Parser Layer 1 - Pure parser module, zero deps, SPEC-compliant #tools _done:2026-01-27
- [x] Go mobile-first PWA with quick capture FAB, bottom nav, responsive layout #frontend _done:2026-01-26
- [x] Make dashboard dynamic - live data from ~/tasks.md via API #frontend _done:2026-01-26
- [x] Build CRUD API with parser module, file locking, backup system #backend _done:2026-01-26
- [x] Update README for v2.0.0 with checkbox states and features #docs _done:2026-01-22
- [x] Bump to v2.0.0 with checkbox states and Eisenhower support #tools _done:2026-01-22
- [x] Add CLAUDE.md with branch-only development policy #docs _done:2026-01-22
- [x] Update list-tasks.md for new states and Eisenhower display #tools _done:2026-01-22
- [x] Fix data location default to ~/tasks.md #tools _done:2026-01-22
- [x] Add 3-level nesting with completion semantics #tools _done:2026-01-10
- [x] Add @mentions to format spec #docs _done:2026-01-10
- [x] Add _spent: time tracking to format spec #docs _done:2026-01-10
- [x] Create docs/SPEC.md canonical specification #docs _done:2026-01-10
- [x] Initial project setup #tools _done:2026-01-10
- [ ] Build reporting page for viewing recently completed tasks - Allow filtering/viewing completed items beyond 12-hour grace period, with date ranges, filters by tag/section, export options #tasks-ng #feature +important
