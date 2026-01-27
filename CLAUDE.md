# tasks-ng Guidelines

## Git Workflow

**CRITICAL: Always create feature branches BEFORE starting work.**

### Branch Naming Convention

| Range | Purpose | Example |
|-------|---------|---------|
| `0xx-name` | Features | `010-parser-module` |
| `3xx-name` | Fixes and polish | `300-ui-polish` |
| `5xx-name` | Research & POCs (never merge) | `500-experiment` |

### Rules
- Never commit directly to main
- Always rebase before merge (linear history)
- Fast-forward merges only (`--ff-only`)

### Complete Workflow

```bash
# 1. Create feature branch
git checkout main && git pull
git checkout -b NNN-feature-name

# 2. Develop and commit
git add <files>
git commit -m "feat: description"

# 3. Merge to main (rebase first if needed)
git checkout main && git pull
git merge NNN-feature-name --ff-only
git push origin main
```

## Project Context

- **Package manager:** bun (not npm)
- **Framework:** Next.js 15+ with App Router
- **Language:** TypeScript
- **Deployment:** Docker with nginx reverse proxy (service-dashboard pattern)
- **Dev location:** ~/local/projects/tasks-ng/
- **Runtime location:** ~/local/services/tasks-ng/
- **Port:** Dynamically assigned by service-dashboard (currently 8082)

## Key Decisions

- **OpenAI API over subprocess:** Direct fetch to OpenAI API (not bun subprocess spawn) for chat feature
- **Docker compose:** Use `docker compose` (not docker-compose)
