# AGENTS.md

## Cursor Cloud specific instructions

This is a **React + Vite + TypeScript** frontend SPA (Sunway ERP Platform). The backend API is external (not in this repo).

### Quick reference

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Dev server | `npm run dev` (Vite on port 5173) |
| Lint | `npm run lint` |
| Build | `npm run build` (runs `tsc -b && vite build`) |
| Preview | `npm run preview` |

### Key notes

- **No automated tests**: The project has no test runner or test files configured. Validation is done via lint + build + manual testing.
- **API proxy**: The Vite dev server proxies `/api` requests. By default it targets the production API at `https://api.picominds.com`. Override with `VITE_PROXY_TARGET=http://localhost:8080 npm run dev` if a local backend is available.
- **ESLint**: Pre-existing lint warnings/errors exist (263 issues: 28 errors, 235 warnings). These are in existing code. The lint command exits non-zero due to pre-existing errors — this is expected.
- **Auth**: The app uses JWT authentication. The login page is at `/login`. Credentials are validated against the backend API.
- **Path aliases**: `@/` maps to `./src/` (configured in `tsconfig.json` and `vite.config.ts`).
