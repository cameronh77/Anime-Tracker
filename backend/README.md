# Kansou backend

Node + TypeScript API: [Hono](https://hono.dev) server, [Drizzle](https://orm.drizzle.team) for PostgreSQL, [Better Auth](https://better-auth.com) for accounts.

## Setup (local)

1. Have Postgres running locally (Postgres.app works) and create the database once: `createdb kansou`
2. Copy `.env.example` to `.env` and fill in `BETTER_AUTH_SECRET` (`openssl rand -base64 32`)
3. `npm install`, then `npm run db:migrate` to create the tables
4. `npm run dev` (or `npm run dev` from the repo root to run frontend + backend together)

The API runs on http://localhost:3001/api. In dev the frontend's Vite server forwards `/api/*` here, so frontend code just calls `fetch('/api/...')`.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the API, restarting on file changes |
| `npm run typecheck` | Type-check without running |
| `npm run db:generate` | After editing `src/db/schema.ts`, create a new migration in `drizzle/` |
| `npm run db:migrate` | Apply pending migrations to the database |
| `npm run db:studio` | Open Drizzle Studio to browse the data |

## Layout

```
src/
  index.ts          Starts the HTTP server
  app.ts            Hono app: session middleware, mounts routes under /api
  auth.ts           Better Auth config (email + password sign-up/sign-in)
  env.ts            Reads and checks .env
  db/schema.ts      All tables (auth tables, anime cache, library, diary, lists, favourites, follows)
  db/index.ts       Drizzle database connection
  routes/           API routes (library.ts is the example to copy)
drizzle/            Generated SQL migrations (commit these)
```

## Endpoints so far

- `GET /api/health`
- `POST /api/auth/sign-up/email`, `POST /api/auth/sign-in/email`, `POST /api/auth/sign-out`, `GET /api/auth/get-session` (all Better Auth endpoints live under `/api/auth/*`)
- `GET /api/library`: the signed-in user's library entries joined with anime details

## Production

Create a hosted Postgres database (Neon or Supabase), set `DATABASE_URL` to its connection string, set `BETTER_AUTH_URL` to the site's real URL, generate a fresh `BETTER_AUTH_SECRET`, and run `npm run db:migrate` against it.
