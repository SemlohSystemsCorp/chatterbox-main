# Chatterbox - Development Guidelines

## Commit Convention

All commits must use a **type prefix** followed by a colon and a short description.

### Format

```
type: short description of change
```

### Types

| Type | When to use |
|------|-------------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `chore` | Maintenance, deps, config, CI — no user-facing change |
| `refactor` | Code restructuring without changing behavior |
| `docs` | Documentation only |
| `style` | Formatting, whitespace, missing semicolons — no logic change |
| `test` | Adding or updating tests |
| `perf` | Performance improvement |
| `patch` | Small, targeted fix (hotfix-level) |
| `release` | Version bump or release preparation |

### Examples

```
feat: add command palette with keyboard shortcuts
fix: call-in-progress UI not clearing when calls end
chore: replace inline spinners with unified Spinner component
refactor: use supabaseAdmin instead of inline service clients
test: add tests for call end API route
docs: add commit convention to CLAUDE.md
perf: debounce presence updates to reduce DB writes
patch: fix setStartingCall stuck in loading state
```

### Rules

- Keep the first line under 72 characters
- Use imperative mood ("add" not "added", "fix" not "fixed")
- Body is optional — use it for "why" context when the change isn't obvious

