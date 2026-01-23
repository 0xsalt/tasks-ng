# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2026-01-22

### Added
- Checkbox state machine: `[/]` in-progress, `[?]` blocked, `[-]` abandoned, `[>]` deferred
- Eisenhower matrix support: `+urgent` and `+important` can combine
- New modifiers: `+continuous`, `+waiting:X`, `+next`, `+recurring`
- CLAUDE.md with branch-only development policy
- "For Digital Assistants" section in README
- `TASKS_FILE` environment variable for configurable location

### Changed
- SPEC.md bumped to v2.0.0
- list-tasks.md updated for new checkbox states and Eisenhower display
- Default task file location now `~/tasks.md` (configurable)
- Removed single-status constraint (multiple modifiers allowed)

### Fixed
- Date prefix consistency (`_due:` not `+due:`)

### Removed
- Personal references from skill description

## [0.2.0-alpha] - 2026-01-10

### Added
- Initial project structure from existing tasks skill
- `@mentions` for people and project assignments
- `_spent:` time tracking in minutes
- 3-level task nesting with 4-space indentation
- Completion semantics: parent requires all children complete
- docs/SPEC.md as canonical format specification (v1.2.0)
- docs/INSPIRATION.md with credits and references
- docs/IDEAS.md for feature proposals
- README.md with project overview

## [0.1.0-alpha] - 2026-01-10

### Added
- Initial skill definition (SKILL.md)
- CLI tools: list-tasks.md, migrate-completed-tasks.md
- Task format with #tags, +status, _dates metadata
- TASK-MANAGEMENT.md methodology documentation
