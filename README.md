# Kansou (感想)

A social-diary app for anime: log what you finish, rate it (half-stars), review it, track episode progress, build lists, and see your stats.

## Layout

```
frontend/   React + TypeScript + Vite web app (everything the browser runs)
backend/    Hono + Drizzle + PostgreSQL API with Better Auth (see backend/README.md)
```

## Run

First-time backend setup (database + `.env`) is in [backend/README.md](backend/README.md). Then, from this folder:

```bash
npm install   # installs root, frontend and backend packages
npm run dev   # runs the API (localhost:3001) and the web app (localhost:5173) together
```

## Frontend stack

- React + TypeScript + Vite, React Router
- Anime data: [AniList GraphQL API](https://docs.anilist.co) (no key needed; currently ~30 requests/minute, so requests are queued and cached in `frontend/src/api/anilist.ts`). Anime are identified by their MyAnimeList ID everywhere in the app.
- User data: localStorage via `frontend/src/store/library.ts` (export/import JSON from the Profile page)

```
frontend/src/
  api/anilist.ts       AniList client (search, seasonal, top, details), converts to our Anime type
  api/auth.ts          Sign-in/sign-up client for the backend
  store/library.ts     All user state + actions (status, episodes, ratings, diary, lists, favourites)
  components/          Navbar, AnimeCard/Grid, StarRating, LogModal, Review
  pages/               Home, Search, AnimeDetail, Diary, Library, Lists, ListDetail, Profile, SignIn
```

## Ideas for next steps

- Backend + accounts in `backend/` (swap `frontend/src/store/library.ts` actions for API calls) so users can follow each other and see friends' activity
- Per-episode ratings / episode discussions
- Import from MyAnimeList / AniList exports
- Year-in-review page
