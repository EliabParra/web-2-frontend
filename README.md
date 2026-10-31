# Toproc Frontend

React + Vite + shadcn/ui frontend for the Toproc backend (`web-2-backend`). It talks to the backend through same-origin requests only: `GET /csrf`, `POST /login`, `POST /logout` and `POST /toProccess` (`{ tx, params }`).

## Development

Requirements: Node.js 20+ and npm.

1. Start the backend on `http://localhost:3000` (see the backend's `docs/DEV.md`).
2. Run the frontend:

   ```sh
   npm ci
   npm run dev
   ```

3. Open `http://localhost:8080`. The Vite dev server proxies `/toProccess`, `/login`, `/logout` and `/csrf` to `http://localhost:3000`, so the browser sees a single origin and the session cookie works.

Log in with a backend user (the seeded admin uses the username and password from the backend `.env`).

| Command | What it does |
|---------|--------------|
| `npm run dev` | Dev server with the backend proxy |
| `npm run build` | Production build into `dist/` |
| `npm test` | Unit tests (Vitest) |
| `npm run lint` | ESLint |

`VITE_API_URL` is optional (default: empty, same origin). Only set it when the API lives on another origin.

## Production

The frontend is not deployed on its own: the backend image builds it (`npm ci && npm run build`) and serves `dist/` as an SPA on the same port as the API. See the backend's `docs/DEPLOY.md` for the install and update steps.

## Code map

- `src/api/client.ts` – fetch client: CSRF token, `post()`, `tx()`.
- `src/api/tx.ts` – transaction numbers (from the backend's deterministic BO registration).
- `src/hooks/useTx.ts` – `useTx()` for reads, `runTx()` for writes with toasts.
- `src/contexts/AuthContext.tsx` – login/logout; the user is kept in `localStorage` and cleared when the backend rejects the session.
- `src/components/modules/` – one screen per module.
