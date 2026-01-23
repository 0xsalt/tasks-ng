# Claude Code Instructions

## Git Workflow

**NEVER develop on main.** Always:
1. Create a feature branch from main
2. Develop and commit on the branch
3. Push branch and create PR
4. Merge to main via PR only

```bash
git checkout -b feature/description
# ... work ...
git push -u origin feature/description
```
