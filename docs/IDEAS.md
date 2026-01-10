# Ideas

Potential features and format extensions for evaluation.

---

## IDEA-001: Energy & Attention Tags

**Status:** Evaluating

**Problem:** Not all tasks are equal - some require high focus, others can be done when tired. No way to match tasks to current state.

**Proposed Format:**
```markdown
- [ ] Review docs #docs +energy:low +attention:medium
- [ ] Debug auth system #backend +energy:high +attention:high
```

**Options:**
- Extend `+status` prefix: `+energy:low`
- New prefix: `~energy:low`
- Compound tags: `#energy/low`

**Open Questions:**
- Which prefix convention?
- Predefined levels (low/med/high) or numeric (1-5)?
- Should tooling filter by "what can I do right now"?

---

## IDEA-002: Attention Tax Score

**Status:** Evaluating

**Problem:** Hard to estimate cognitive load for the day. Need a way to quantify task demands.

**Concept:** Score that represents cognitive cost. Higher = more demanding.

**Possible Calculation:**
```
attention_tax = estimated_time × attention_level
```

**Use Cases:**
- "I have 4 hours and medium energy - what fits?"
- Daily capacity planning
- Avoiding overload

**Open Questions:**
- Manual score or computed from metadata?
- Where does score live? (metadata vs computed property)

---

## IDEA-003: Priority Tiers (Eisenhower Matrix)

**Status:** Evaluating

**Problem:** `+urgent` conflates urgency with importance. Need to distinguish.

**Current:** `+urgent` (single status)
**Proposed:** Add importance tiers alongside urgency

**Format Options:**
```markdown
- [ ] Critical feature #backend +p1 _due:2026-01-15
- [ ] Nice-to-have #frontend +p3
```

**Eisenhower Quadrants:**
1. Urgent + Important (`+p1` + near `_due:`) → Do first
2. Important + Not Urgent (`+p1` + no due) → Schedule
3. Urgent + Not Important (`+p3` + near `_due:`) → Delegate
4. Neither → Eliminate

**Open Questions:**
- `+p1/p2/p3` or `+high/med/low`?
- How does tooling surface "do first" items?

---

## IDEA-004: Human vs AI Tasks

**Status:** Evaluating

**Problem:** Some tasks are for human execution, others for AI/automation. Different workflows.

**Concept:** Distinguish task executor.

**Format Options:**
```markdown
- [ ] Review PR #work @human
- [ ] Generate report #work @ai
```

Or use tags:
```markdown
- [ ] Review PR #work #human-task
- [ ] Generate report #work #ai-task
```

**Use Cases:**
- AI can auto-execute its tasks
- Filter "what do I need to do" vs "what should AI do"
- Different completion workflows

---

## IDEA-005: Session Start Integration

**Status:** Planned

**Problem:** No automated surfacing of relevant tasks at session start.

**Concept:** Task skill "morning mode" that:
- Shows overdue tasks
- Shows today's due items
- Recommends what to work on based on context
- Pre-computes to save tokens

**Implementation:**
```bash
bun list-tasks.md --morning
```

**Output:**
```
Overdue (2):
- [ ] Submit report _due:2026-01-08

Due Today (1):
- [ ] Review PR _due:2026-01-10

Recommended Next:
- [ ] Fix auth bug +p1 +inprogress
```

---

## IDEA-006: Obsidian Integration

**Status:** Evaluating

**Problem:** Plain markdown works but lacks visual polish. Obsidian could provide rich rendering.

**Features to Support:**
- Dataview queries for dynamic views
- Tasks plugin compatibility
- CSS for colored tag pills
- Priority groupings (P1, P2 sections)
- Due date highlighting

**Open Questions:**
- Design format to be Obsidian-compatible without requiring it?
- Which Obsidian plugins to target?

---

## IDEA-007: Recurring Tasks

**Status:** Evaluating

**Problem:** No way to represent tasks that repeat on schedule.

**Proposed Format:**
```markdown
- [ ] Weekly review #personal _every:weekly _day:friday
- [ ] Run maintenance #ops _every:daily _at:06:00
```

**Metadata:**
- `_every:` — Frequency (daily, weekly, monthly)
- `_day:` — Day of week (for weekly)
- `_at:` — Time of day (optional)

**Open Questions:**
- How to track completion of recurring tasks?
- Generate next instance on completion?
- Separate from one-time tasks?

---

## IDEA-008: Estimated Time

**Status:** Evaluating

**Problem:** No way to know how long tasks take. Hard to plan day.

**Proposed Format:**
```markdown
- [ ] Write docs #docs _est:60
- [ ] Quick fix #backend _est:15
```

**Use Cases:**
- "I have 30 minutes - what fits?"
- Daily capacity planning
- Combine with attention tax

---

## IDEA-009: Context Tags

**Status:** Evaluating

**Problem:** Some tasks can only be done in certain contexts (work, home, errands).

**Proposed Format:**
```markdown
- [ ] Buy groceries #personal #context/errands
- [ ] Debug server #work #context/office
- [ ] Read article #research #context/anywhere
```

**Use Cases:**
- Filter by current context
- "What can I do while commuting?"
- Location-aware task suggestions

---

## IDEA-010: Smart Recommendations

**Status:** Vision

**The Goal:**
> "Given everything, what should I work on now?"
> ...and the answer is right.

**Required Context:**
- Current energy/attention level
- Available time
- Current location/context
- Task priorities and due dates
- Dependencies

**This is the north star.** All other features feed into this capability.

---

## Open Questions (General)

1. How many metadata types before format is too complex?
2. Should derived values (attention tax) be in format or computed by tooling?
3. How to balance grep-friendliness with rich metadata?
4. Integration with calendar for time-blocking?

---

## Design Principle

> Don't over-engineer. A simple system that gets used beats a complex one that doesn't.

---

*Last updated: 2026-01-10*
