# Frontend agents

Read [CLAUDE.md](./CLAUDE.md).

## Cursor rules (`.cursor/rules/`)

| File | Scope |
|------|--------|
| `project.mdc` | Always — stack, folders, modules, API errors |
| `capture-knowledge.mdc` | Always — append to rules/skills when you add undocumented patterns |
| `git-commits.mdc` | Always — commit policy |
| `split-large-components.mdc` | `**/*.tsx` — split components at 250+ lines |

After non-trivial work, check whether anything you did is missing from the table above or from **Skills**; if so, update docs in the same session (`capture-knowledge.mdc`).

## Skills (`.cursor/skills/`)

| Skill | When |
|-------|------|
| `erp-development` | Any UI, service, type, or route work |

Backend is a separate repo: `../backend`.
