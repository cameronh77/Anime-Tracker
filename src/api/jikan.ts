import type { Anime, AnimeSnapshot } from '../types';

const BASE = 'https://api.jikan.moe/v4';

// Jikan allows ~3 requests/second, so space requests out and cache results.
const MIN_GAP_MS = 400;
let lastRequest = 0;
let queue: Promise<unknown> = Promise.resolve();
const cache = new Map<string, unknown>();

async function get<T>(path: string): Promise<T> {
  if (cache.has(path)) return cache.get(path) as T;

  const run = async (): Promise<T> => {
    const wait = Math.max(0, lastRequest + MIN_GAP_MS - Date.now());
    if (wait) await new Promise((r) => setTimeout(r, wait));
    lastRequest = Date.now();

    let res = await fetch(BASE + path);
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 1200));
      lastRequest = Date.now();
      res = await fetch(BASE + path);
    }
    if (!res.ok) throw new Error(`Jikan request failed (${res.status})`);
    const json = (await res.json()) as T;
    cache.set(path, json);
    return json;
  };

  const p = queue.then(run, run);
  queue = p.catch(() => undefined);
  return p;
}

interface Paged<T> {
  data: T[];
  pagination: { has_next_page: boolean; last_visible_page: number };
}

/** Jikan often returns the same show twice across pages; drop duplicates. */
function unique(list: Anime[]): Anime[] {
  const seen = new Set<number>();
  return list.filter((a) => !seen.has(a.mal_id) && seen.add(a.mal_id));
}

export async function searchAnime(query: string, page = 1) {
  const q = encodeURIComponent(query);
  const res = await get<Paged<Anime>>(`/anime?q=${q}&page=${page}&limit=24&sfw=true&order_by=members&sort=desc`);
  return { ...res, data: unique(res.data) };
}

export async function getSeasonNow() {
  const res = await get<Paged<Anime>>('/seasons/now?limit=24&sfw=true');
  return unique(res.data);
}

export async function getTopAnime(filter?: 'airing' | 'upcoming' | 'bypopularity') {
  const f = filter ? `&filter=${filter}` : '';
  const res = await get<Paged<Anime>>(`/top/anime?limit=24&sfw=true${f}`);
  return unique(res.data);
}

export async function getAnime(id: number) {
  const res = await get<{ data: Anime }>(`/anime/${id}/full`);
  return res.data;
}

export function snapshot(a: Anime): AnimeSnapshot {
  return {
    mal_id: a.mal_id,
    title: a.title_english || a.title,
    image: a.images.jpg.large_image_url || a.images.jpg.image_url,
    type: a.type,
    episodes: a.episodes,
    year: a.year ?? (a.aired?.string ? parseInt(a.aired.string.match(/\d{4}/)?.[0] ?? '', 10) || null : null),
    genres: a.genres.map((g) => g.name),
    studios: a.studios.map((s) => s.name),
  };
}
