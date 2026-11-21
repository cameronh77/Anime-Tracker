import { useSyncExternalStore } from 'react';
import type {
  AnimeList,
  AnimeSnapshot,
  DiaryEntry,
  LibraryEntry,
  LibraryState,
  WatchStatus,
} from '../types';

// All user data lives here. It's persisted to localStorage for now; swapping
// this module for API calls is the path to a real multi-user backend.

const KEY = 'kansou:library:v1';
const MAX_FAVOURITES = 4;

const empty: LibraryState = {
  username: 'you',
  entries: {},
  diary: [],
  lists: [],
  favourites: [],
};

function load(): LibraryState {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...empty, ...JSON.parse(raw) } : empty;
  } catch {
    return empty;
  }
}

let state: LibraryState = load();
const listeners = new Set<() => void>();

function set(next: LibraryState) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked; keep in memory */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useLibrary<T>(select: (s: LibraryState) => T): T {
  return useSyncExternalStore(subscribe, () => select(state));
}

const now = () => new Date().toISOString();
const uid = () => crypto.randomUUID();
export const today = () => new Date().toISOString().slice(0, 10);

/** Every anime we know about locally (library entries carry the snapshot). */
export function getSnapshot(id: number): AnimeSnapshot | undefined {
  return state.entries[id]?.anime;
}

function upsertEntry(anime: AnimeSnapshot, patch: Partial<LibraryEntry>) {
  const base = state.entries[anime.mal_id] ?? {
    status: 'plan_to_watch' as const,
    episodesWatched: 0,
    rating: null,
    liked: false,
  };
  const entry: LibraryEntry = { ...base, ...patch, anime, updatedAt: now() };
  // Finishing a show fills in the episode count.
  if (patch.status === 'completed' && anime.episodes) entry.episodesWatched = anime.episodes;
  set({ ...state, entries: { ...state.entries, [anime.mal_id]: entry } });
}

export const library = {
  setStatus(anime: AnimeSnapshot, status: WatchStatus) {
    upsertEntry(anime, { status });
  },

  setEpisodes(anime: AnimeSnapshot, episodesWatched: number) {
    const max = anime.episodes ?? Infinity;
    const eps = Math.max(0, Math.min(max, episodesWatched));
    const prev = state.entries[anime.mal_id];
    let status = prev?.status ?? 'watching';
    if (status === 'plan_to_watch' && eps > 0) status = 'watching';
    if (anime.episodes && eps === anime.episodes) status = 'completed';
    upsertEntry(anime, { episodesWatched: eps, status });
  },

  setRating(anime: AnimeSnapshot, rating: number | null) {
    upsertEntry(anime, { rating });
  },

  toggleLike(anime: AnimeSnapshot) {
    upsertEntry(anime, { liked: !state.entries[anime.mal_id]?.liked });
  },

  removeEntry(id: number) {
    const entries = { ...state.entries };
    delete entries[id];
    set({ ...state, entries, favourites: state.favourites.filter((f) => f !== id) });
  },

  /** Log a watch to the diary; also updates the library entry's rating/like. */
  log(anime: AnimeSnapshot, data: Omit<DiaryEntry, 'id' | 'animeId' | 'createdAt'>) {
    const entry: DiaryEntry = { ...data, id: uid(), animeId: anime.mal_id, createdAt: now() };
    const prev = state.entries[anime.mal_id];
    upsertEntry(anime, {
      status: prev?.status === 'watching' && !data.rewatch ? 'completed' : prev?.status ?? 'completed',
      rating: data.rating ?? prev?.rating ?? null,
      liked: data.liked || !!prev?.liked,
    });
    set({ ...state, diary: [entry, ...state.diary] });
  },

  deleteLog(id: string) {
    set({ ...state, diary: state.diary.filter((d) => d.id !== id) });
  },

  toggleFavourite(anime: AnimeSnapshot) {
    const id = anime.mal_id;
    if (!state.entries[id]) upsertEntry(anime, {});
    if (state.favourites.includes(id)) {
      set({ ...state, favourites: state.favourites.filter((f) => f !== id) });
      return true;
    }
    if (state.favourites.length >= MAX_FAVOURITES) return false;
    set({ ...state, favourites: [...state.favourites, id] });
    return true;
  },

  createList(name: string, description = '', ranked = false): string {
    const list: AnimeList = { id: uid(), name, description, ranked, animeIds: [], createdAt: now() };
    set({ ...state, lists: [list, ...state.lists] });
    return list.id;
  },

  updateList(id: string, patch: Partial<Omit<AnimeList, 'id'>>) {
    set({ ...state, lists: state.lists.map((l) => (l.id === id ? { ...l, ...patch } : l)) });
  },

  deleteList(id: string) {
    set({ ...state, lists: state.lists.filter((l) => l.id !== id) });
  },

  toggleInList(listId: string, anime: AnimeSnapshot) {
    if (!state.entries[anime.mal_id]) upsertEntry(anime, {});
    const list = state.lists.find((l) => l.id === listId);
    if (!list) return;
    const has = list.animeIds.includes(anime.mal_id);
    library.updateList(listId, {
      animeIds: has ? list.animeIds.filter((i) => i !== anime.mal_id) : [...list.animeIds, anime.mal_id],
    });
  },

  moveInList(listId: string, index: number, dir: -1 | 1) {
    const list = state.lists.find((l) => l.id === listId);
    if (!list) return;
    const ids = [...list.animeIds];
    const j = index + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    library.updateList(listId, { animeIds: ids });
  },

  setUsername(username: string) {
    set({ ...state, username: username.trim() || 'you' });
  },

  exportJson() {
    return JSON.stringify(state, null, 2);
  },

  importJson(json: string) {
    const parsed = JSON.parse(json) as LibraryState;
    if (!parsed || typeof parsed.entries !== 'object') throw new Error('Not a Kansou export');
    set({ ...empty, ...parsed });
  },
};
