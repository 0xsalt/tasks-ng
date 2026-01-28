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

## Web Testing

**CRITICAL: Verify web changes with Playwright before claiming they are implemented.**

### Why
- Source edits in `~/local/projects/tasks-ng/dashboard/` must be synced to `~/local/services/tasks-ng/`
- Docker containers cache builds; services must be rebuilt and restarted
- HTML response may show loading skeleton before JavaScript hydrates

### Verification Process

```bash
# 1. Sync source to services
cp <changed-files> ~/local/services/tasks-ng/<path>/

# 2. Rebuild and restart
cd ~/local/services/tasks-ng
docker compose build --no-cache app
docker compose down && docker compose up -d

# 3. Wait for healthy status
sleep 20 && docker compose ps

# 4. Screenshot with Playwright
cd ~/.claude/skills/Browser
bun -e "
import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('https://the-commons.taila8bee6.ts.net:8082/', { waitUntil: 'networkidle' });
await page.screenshot({ path: '/tmp/verify.png' });
await browser.close();
"

# 5. View screenshot to confirm changes
Read /tmp/verify.png
```

**Never claim a web change is complete without viewing the screenshot.**

## Key Decisions

- **OpenAI API over subprocess:** Direct fetch to OpenAI API (not bun subprocess spawn) for chat feature
- **Docker compose:** Use `docker compose` (not docker-compose)
