# References & Inspiration

## AJ Van Beest

Early conversations with AJ helped crystallize the vision for this project. His description of the core problem became a driving principle for this project:

> "My goal with that is to provide so much context to my robot that I can simply ask 'Given everything, what should I work on now?' ...and its answer will be right."

Check out his work: [daemon.ajvanbeest.com](https://daemon.ajvanbeest.com/)

---

## tasks.md (https://tasks.md/)

*Captured: 2026-01-10*

Stumbled across this page and the simplicity of the format immediately clicked. A local-first private by default task manager that uses plain Markdown files. This was a key inspiration for this human AND machine readable approach.

### Philosophy

- Tasks stored in plain Markdown files
- Open format ensures data is always accessible, portable, and easy to manage with any text editor
- Multiple storage backends (local filesystem, OneDrive)
- No vendor lock-in, full data ownership
- Privacy-first: data stays local or in user's own cloud account

### Syntax Elements

| Element | Format | Example |
|---------|--------|---------|
| Pending task | `[ ]` | `- [ ] Review docs` |
| Completed task | `[x]` | `- [x] Ship feature` |
| Tags | `#category` | `#work`, `#design`, `#personal` |
| Mentions | `@person` or `@project` | `@finance`, `@frontend`, `@sarah` |
| Priority/Status | `+marker` | `+urgent`, `+inprogress`, `+fun` |
| Due date | `due:YYYY-MM-DD` | `due:2025-06-06` |
| Done date | `_done:YYYY-MM-DD` | `_done:2025-06-04` |
| Time spent | `_spent:minutes` | `_spent:2700` |
| Subtasks | Indented bullets | Nested under parent task |

### Organization

- Section headers with emoji for visual grouping
- Categories like: Urgent & Important, Projects, Personal Errands, Learning
- Hierarchical nesting via indentation

### Key Features

1. **Keyboard-driven** - Navigate and manage with shortcuts
2. **Flexible storage** - Local or cloud backends
3. **Human-readable** - Works with any text editor
4. **Structured metadata** - Machine-parseable but readable
