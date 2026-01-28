# BACKLOG.md

> Single source of work.
> Review regularly.
> Top item is next.

---

## NOW

- [ ] Eisenhower quadrant grid as default homepage layout with "Today" title #005 #frontend #ux

## BACKLOG
- [ ] Research Docker build time optimization - Current: 60s+ full rebuilds for code changes. Research: (1) is full rebuild needed every time? (2) what triggers rebuilds? (3) hot reload in dev? (4) build caching strategies? (5) service-dashboard compatibility? (6) separate dev (fast iteration) vs prod (robust) workflows? Goal: rapid iterative development with <5s feedback loop. #devops #performance #research
- [ ] Add info bubble "(i)" next to "Eisenhower" header with description and link to authoritative source #frontend #ux
- [ ] Fix Eisenhower filter tile unselect bug - should revert to default unclicked state with no outline #frontend #bugfix
- [ ] Light/Dark/Auto mode toggle - implement same pattern as ~/local/projects/whereis-emmy/ #frontend #ui
- [ ] Settings page: Toggle for single-task-in-progress enforcement (currently allows multiple [/] tasks, make it optional) #frontend #settings
- [ ] Investigate optimistic locking for concurrent CRUD writes (design note: rapid parallel inserts can overlap) #backend
- [ ] Deploy updated skill to ~/.claude/skills/tasks/ #tools
- [ ] Validation command (check tasks.md against spec) #tools
- [ ] migrate-completed-tasks.md update for new checkbox states #docs
- [ ] Time tracking summary command (sum _spent: by tag/date) #tools
- [ ] Due date reminder integration (ntfy?) #tools

## ROADMAP

> **Note:** This is the public technical roadmap. For business strategy, competitive analysis, and market positioning, see `docs/internal/BUSINESS_STRATEGY.md` and `docs/internal/OBSIDIAN_COMPETITIVE_ANALYSIS.md`.

### Layer 1: Core Functional Features (Public API)

**Web UI - Core CRUD:**
- [ ] Live task list from tasks.md - parse and display with filters #frontend #layer1
- [ ] Create/edit tasks via form - generate valid format, write back #frontend #layer1
- [ ] Inline editing - click task to edit in place #frontend #layer1
- [ ] Drag-drop reordering - move between NOW/BACKLOG/DONE #frontend #layer1

**Web UI - Visualization:**
- [ ] Eisenhower matrix view - 4-quadrant visual grid #frontend #layer1
- [ ] Kanban board - columns by status or section #frontend #layer1
- [ ] Calendar view - tasks by _due: date #frontend #layer1
- [ ] Time tracking charts - burndown, time by tag #frontend #layer1

**Mobile/PWA:**
- [ ] Touch-optimized PWA - offline-first with sync #frontend #layer1
- [ ] Quick capture widget - add tasks fast on mobile #frontend #layer1

### Layer 2: File Operations & Sync

**API & Backend:**
- [ ] WebSocket sync - multi-device real-time #backend #layer2
- [ ] Multi-file support - project-specific task files #backend #layer2
- [ ] Conflict resolution for concurrent edits #backend #layer2
- [ ] Export/import (JSON, CSV, other formats) #backend #layer2

### Layer 3: AI-Enhanced Features (PAI Integration)

**Natural Language & Voice:**
- [ ] Natural language task entry - "Remind me to call Bob Tuesday" #ai #layer3
- [ ] Web voice interface - record audio, transcribe to file, process as updates #ai #layer3

**Smart Intelligence:**
- [ ] Smart prioritization - suggest Eisenhower quadrant #ai #layer3
- [ ] Task decomposition - break down large tasks #ai #layer3
- [ ] Context-aware task suggestions based on time/location/patterns #ai #layer3
- [ ] Automated task generation from meeting notes or emails #ai #layer3

### Distribution & Deployment
- [ ] Create standalone Dockerfile with env-based configuration (no Tailscale required) #deployment
- [ ] Add environment variable fallbacks for optional PAI features #backend
- [ ] Create docker-compose.yml template for self-hosted users #deployment
- [ ] Document Docker Hub deployment workflow in README.md #docs
- [ ] Publish container image to Docker Hub as chrislacoste/tasks-ng #deployment
- [ ] Create Railway deployment configuration (railway.json) #deployment
- [ ] Add "Deploy to Railway" button to README #docs
- [ ] Research DigitalOcean App Platform deployment spec #deployment
- [ ] Add health check endpoint for platform monitoring #backend
- [ ] Extract CLI commands into standalone npm package #tools
- [ ] Design CLI with init/serve/add/list/sync commands #tools
- [ ] Publish CLI to npm registry as @chrislacoste/tasks-ng #deployment

### Business & Market Validation
- [ ] Document product positioning and unique value propositions #business
- [ ] Create comparison table vs Todoist/Things/Linear/Obsidian Tasks #business
- [ ] Design freemium feature split (basic free vs AI premium) #business
- [ ] Research multi-tenancy architecture for hosted offering #architecture
- [ ] Design user authentication system (NextAuth.js) #backend
- [ ] Create landing page with feature showcase #marketing
- [ ] Design pricing tiers (self-hosted free / managed hosting premium) #business
- [ ] Set up analytics for feature usage tracking #backend
- [ ] Create feedback collection system (in-app + Discord/GitHub) #community

### Other
- [ ] Task dependencies (blocked-by relationships) #tools
- [ ] Project-specific task file discovery #tools
- [ ] Integration with private-journal for task completion logging #tools

## DONE

- [x] Make checkbox icons clickable to cycle states: [ ] → [/] → [x] → [ ] (3-state cycle with hover effects) #frontend _done:2026-01-27
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
