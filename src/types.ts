// Minimal shape of the anime data we use from the Jikan API (MyAnimeList).
export interface Anime {
  mal_id: number;
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  images: { jpg: { image_url: string; large_image_url: string } };
  type: string | null; // TV, Movie, OVA, ONA, Special...
  episodes: number | null;
  status: string | null;
  airing: boolean;
  aired?: { string: string };
  duration: string | null;
  rating: string | null;
  score: number | null;
  synopsis: string | null;
  season: string | null;
  year: number | null;
  studios: { mal_id: number; name: string }[];
  genres: { mal_id: number; name: string }[];
  themes?: { mal_id: number; name: string }[];
  trailer?: { youtube_id: string | null; embed_url: string | null };
}

/** The bits of an anime we keep locally so the library works offline. */
export interface AnimeSnapshot {
  mal_id: number;
  title: string;
  image: string;
  type: string | null;
  episodes: number | null;
  year: number | null;
  genres: string[];
  studios: string[];
}

export type WatchStatus =
  | 'watching'
  | 'completed'
  | 'on_hold'
  | 'dropped'
  | 'plan_to_watch';

export const STATUS_LABELS: Record<WatchStatus, string> = {
  watching: 'Watching',
  completed: 'Completed',
  on_hold: 'On hold',
  dropped: 'Dropped',
  plan_to_watch: 'Plan to watch',
};

/** One row per anime in the user's library. */
export interface LibraryEntry {
  anime: AnimeSnapshot;
  status: WatchStatus;
  episodesWatched: number;
  rating: number | null; // 0.5 – 5 in half steps
  liked: boolean;
  updatedAt: string;
}

/** A diary log: a single "I watched / finished this" event, optionally with a review. */
export interface DiaryEntry {
  id: string;
  animeId: number;
  watchedOn: string; // YYYY-MM-DD
  rating: number | null;
  liked: boolean;
  rewatch: boolean;
  review: string;
  spoilers: boolean;
  createdAt: string;
}

export interface AnimeList {
  id: string;
  name: string;
  description: string;
  ranked: boolean;
  animeIds: number[];
  createdAt: string;
}

export interface LibraryState {
  username: string;
  entries: Record<number, LibraryEntry>;
  diary: DiaryEntry[];
  lists: AnimeList[];
  favourites: number[]; // up to 4, shown on profile
}
