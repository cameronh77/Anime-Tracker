# Kansou (感想)

A social-diary app for anime: log what you finish, rate it (half-stars), review it, track episode progress, build lists, and see your stats.

## Run

```bash
npm install
npm run dev
```

## Stack

- React + TypeScript + Vite, React Router
- Anime data: [Jikan API v4](https://docs.api.jikan.moe/) (MyAnimeList data, no key needed, ~3 req/s, so requests are queued and cached in `src/api/jikan.ts`)
- User data: localStorage via `src/store/library.ts` (export/import JSON from the Profile page)

## Structure

```
src/
  api/jikan.ts         Jikan client (search, seasonal, top, details)
  store/library.ts     All user state + actions (status, episodes, ratings, diary, lists, favourites)
  components/          Navbar, AnimeCard/Grid, StarRating, LogModal, Review
  pages/               Home, Search, AnimeDetail, Diary, Library, Lists, ListDetail, Profile
```

## Ideas for next steps

- Backend + accounts (swap `store/library.ts` actions for API calls) so users can follow each other and see friends' activity
- Per-episode ratings / episode discussions
- Import from MyAnimeList / AniList exports
- Year-in-review page
