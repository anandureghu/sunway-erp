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
- **API proxy gotcha**: The committed `.env` sets `VITE_APP_BASE_URL=http://localhost:8080/api` (absolute URL), which makes Axios bypass the Vite proxy and hit localhost:8080 directly. Since there is no local backend, you **must** create a `.env.local` file with `VITE_APP_BASE_URL=/api` so requests use the Vite proxy (which forwards to `https://api.picominds.com`). The `.env.local` file is gitignored (`*.local`).
- **Vite proxy target**: Defaults to `https://api.picominds.com`. Override with `VITE_PROXY_TARGET=http://localhost:8080 npm run dev` if a local backend is available.
- **ESLint**: Pre-existing lint warnings/errors exist (263 issues: 28 errors, 235 warnings). These are in existing code. The lint command exits non-zero due to pre-existing errors — this is expected.
- **Auth**: The app uses JWT authentication. The login page is at `/auth/login`. Credentials are validated against the backend API.
- **Path aliases**: `@/` maps to `./src/` (configured in `tsconfig.json` and `vite.config.ts`).
