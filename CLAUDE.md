# Sunway ERP — frontend

React + TypeScript app. Cursor: `.cursor/rules/`, `.cursor/skills/erp-development/`.

**Agents:** If you establish a pattern not already documented, append rules/skills in the same session — see `.cursor/rules/capture-knowledge.mdc` and [AGENTS.md](./AGENTS.md).

## Commands

```bash
npm run dev
npm run build
```

## Layout

`src/pages/` (screens) · `src/modules/hr/` (HR forms) · `src/service/` (API) · `src/types/` · `src/components/ui/`

## Product areas

Dashboard · HR & employees · company admin · inventory · purchase · sales · finance · settings · auth

## Conventions

- API via `apiClient`; map DTOs in `*Service.ts`
- Errors: `getApiErrorMessage()` + toast; forms also use inline alerts when appropriate
- Follow existing patterns in the same `pages/<area>/` folder

## Git

Branch `main`. Commit only when asked; no Co-authored-by lines.

See [AGENTS.md](./AGENTS.md) for rule/skill index.
