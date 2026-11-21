import type { Anime, AnimeSnapshot } from '../types';

// Anime data comes from AniList's free GraphQL API (https://docs.anilist.co).
// Everything in the app (routes, saved library data, the backend) is keyed by
// MyAnimeList ID, so we look anime up by `idMal` and convert AniList's shape
// into our `Anime` type. Pages never see raw AniList data.

const ENDPOINT = 'https://graphql.anilist.co';

// AniList allows ~30 requests/minute right now (90 normally), so space requests
// out, cache results, and back off when it says we're going too fast.
const MIN_GAP_MS = 700;
const TIMEOUT_MS = 10_000;
let lastRequest = 0;
let queue: Promise<unknown> = Promise.resolve();
const cache = new Map<string, unknown>();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function post(body: string): Promise<Response> {
  try {
    return await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    if ((e as Error).name === 'TimeoutError') {
      throw new Error('AniList (the anime database) is not responding right now. Try again in a bit.');
    }
    throw new Error("Couldn't reach AniList (the anime database). Check your connection.");
  }
}

async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const body = JSON.stringify({ query, variables });
  if (cache.has(body)) return cache.get(body) as T;

  const run = async (): Promise<T> => {
    const wait = Math.max(0, lastRequest + MIN_GAP_MS - Date.now());
    if (wait) await sleep(wait);
    lastRequest = Date.now();

    let res = await post(body);
    if (res.status === 429) {
      const retryAfter = Number(res.headers.get('Retry-After')) || 5;
      await sleep(retryAfter * 1000);
      lastRequest = Date.now();
      res = await post(body);
    }
    const json = (await res.json().catch(() => null)) as { data?: T; errors?: { message: string; status?: number }[] } | null;
    if (!res.ok || !json?.data) {
      if (res.status === 404) throw new Error('Anime not found.');
      if (res.status === 429) throw new Error('Too many requests to AniList. Wait a minute and try again.');
      throw new Error(json?.errors?.[0]?.message ?? `AniList request failed (${res.status})`);
    }
    cache.set(body, json.data);
    return json.data;
  };

  const p = queue.then(run, run);
  queue = p.catch(() => undefined);
  return p;
}

// ─── Converting AniList data to our Anime type ─────────────────────────────

const MEDIA_FIELDS = `
  id idMal
  title { romaji english native }
  format episodes status duration averageScore
  season seasonYear
  startDate { year month day }
  endDate { year month day }
  coverImage { large extraLarge }
  genres
  studios(isMain: true) { nodes { id name } }
  tags { id name rank isMediaSpoiler isGeneralSpoiler }
  trailer { id site }
  description(asHtml: false)
`;

interface FuzzyDate { year: number | null; month: number | null; day: number | null }

interface Media {
  id: number;
  idMal: number | null;
  title: { romaji: string | null; english: string | null; native: string | null };
  format: string | null;
  episodes: number | null;
  status: string | null;
  duration: number | null;
  averageScore: number | null;
  season: string | null;
  seasonYear: number | null;
  startDate: FuzzyDate;
  endDate: FuzzyDate;
  coverImage: { large: string | null; extraLarge: string | null };
  genres: string[];
  studios: { nodes: { id: number; name: string }[] };
  tags: { id: number; name: string; rank: number; isMediaSpoiler: boolean; isGeneralSpoiler: boolean }[];
  trailer: { id: string; site: string } | null;
  description: string | null;
}

const FORMATS: Record<string, string> = {
  TV: 'TV', TV_SHORT: 'TV Short', MOVIE: 'Movie', SPECIAL: 'Special', OVA: 'OVA', ONA: 'ONA', MUSIC: 'Music',
};

const STATUSES: Record<string, string> = {
  FINISHED: 'Finished Airing',
  RELEASING: 'Currently Airing',
  NOT_YET_RELEASED: 'Not yet aired',
  CANCELLED: 'Cancelled',
  HIATUS: 'On hiatus',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(d: FuzzyDate): string | null {
  if (!d.year) return null;
  if (!d.month) return String(d.year);
  return `${MONTHS[d.month - 1]}${d.day ? ` ${d.day},` : ''} ${d.year}`;
}

/** AniList descriptions contain a few HTML tags (<br>, <i>) even in plain mode. */
function cleanDescription(text: string | null): string | null {
  if (!text) return null;
  const el = document.createElement('textarea'); // decodes &amp; etc.
  el.innerHTML = text.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
  return el.value.replace(/\n{3,}/g, '\n\n').trim();
}

function toAnime(m: Media): Anime {
  const image = m.coverImage.large ?? m.coverImage.extraLarge ?? '';
  const start = formatDate(m.startDate);
  const end = formatDate(m.endDate);
  return {
    mal_id: m.idMal!,
    title: m.title.romaji ?? m.title.english ?? m.title.native ?? 'Untitled',
    title_english: m.title.english,
    title_japanese: m.title.native,
    images: { jpg: { image_url: image, large_image_url: m.coverImage.extraLarge ?? image } },
    type: m.format ? (FORMATS[m.format] ?? m.format) : null,
    episodes: m.episodes,
    status: m.status ? (STATUSES[m.status] ?? m.status) : null,
    airing: m.status === 'RELEASING',
    aired: start ? { string: end && end !== start ? `${start} to ${end}` : start } : undefined,
    duration: m.duration ? `${m.duration} min${m.format === 'MOVIE' ? '' : ' per ep'}` : null,
    rating: null, // AniList has no age ratings
    score: m.averageScore ? m.averageScore / 10 : null, // 0–100 → 0–10
    synopsis: cleanDescription(m.description),
    season: m.season?.toLowerCase() ?? null,
    year: m.seasonYear ?? m.startDate.year,
    studios: m.studios.nodes.map((s) => ({ mal_id: s.id, name: s.name })),
    genres: m.genres.map((name, i) => ({ mal_id: i, name })),
    // AniList's tags play the role of MAL's "themes": keep the strongest few, no spoilers.
    themes: m.tags
      .filter((t) => t.rank >= 70 && !t.isMediaSpoiler && !t.isGeneralSpoiler)
      .slice(0, 5)
      .map((t) => ({ mal_id: 10_000 + t.id, name: t.name })),
    trailer: {
      youtube_id: m.trailer?.site === 'youtube' ? m.trailer.id : null,
      embed_url: null,
    },
  };
}

/** Our IDs are MAL IDs, so skip the few AniList entries that have none. */
function toAnimeList(media: Media[]): Anime[] {
  const seen = new Set<number>();
  return media
    .filter((m) => m.idMal && !seen.has(m.idMal) && seen.add(m.idMal))
    .map(toAnime);
}

// ─── Queries used by the pages ─────────────────────────────────────────────

const PER_PAGE = 24;

interface PageResult {
  Page: { pageInfo: { hasNextPage: boolean; lastPage: number }; media: Media[] };
}

function pageQuery(args: string, params: string) {
  return `query (${params}) {
    Page(page: $page, perPage: ${PER_PAGE}) {
      pageInfo { hasNextPage lastPage }
      media(type: ANIME, isAdult: false, ${args}) { ${MEDIA_FIELDS} }
    }
  }`;
}

export async function searchAnime(query: string, page = 1) {
  const res = await gql<PageResult>(
    pageQuery('search: $search, sort: [SEARCH_MATCH, POPULARITY_DESC]', '$page: Int, $search: String'),
    { page, search: query },
  );
  return {
    data: toAnimeList(res.Page.media),
    pagination: { has_next_page: res.Page.pageInfo.hasNextPage, last_visible_page: res.Page.pageInfo.lastPage },
  };
}

/** Anime seasons start in Jan (winter), Apr (spring), Jul (summer) and Oct (fall). */
function currentSeason() {
  const now = new Date();
  const seasons = ['WINTER', 'SPRING', 'SUMMER', 'FALL'];
  return { season: seasons[Math.floor(now.getMonth() / 3)], year: now.getFullYear() };
}

export async function getSeasonNow() {
  const { season, year } = currentSeason();
  const res = await gql<PageResult>(
    pageQuery('season: $season, seasonYear: $year, sort: POPULARITY_DESC', '$page: Int, $season: MediaSeason, $year: Int'),
    { page: 1, season, year },
  );
  return toAnimeList(res.Page.media);
}

export async function getTopAnime(filter?: 'airing' | 'upcoming' | 'bypopularity') {
  const args =
    filter === 'airing' ? 'status: RELEASING, sort: SCORE_DESC' :
    filter === 'upcoming' ? 'status: NOT_YET_RELEASED, sort: POPULARITY_DESC' :
    filter === 'bypopularity' ? 'sort: POPULARITY_DESC' :
    'sort: SCORE_DESC';
  const res = await gql<PageResult>(pageQuery(args, '$page: Int'), { page: 1 });
  return toAnimeList(res.Page.media);
}

/** Look up one anime by its MyAnimeList ID (the ID used in our URLs). */
export async function getAnime(malId: number) {
  const res = await gql<{ Media: Media }>(
    `query ($idMal: Int) { Media(idMal: $idMal, type: ANIME) { ${MEDIA_FIELDS} } }`,
    { idMal: malId },
  );
  return toAnime(res.Media);
}

export function snapshot(a: Anime): AnimeSnapshot {
  return {
    mal_id: a.mal_id,
    title: a.title_english || a.title,
    image: a.images.jpg.large_image_url || a.images.jpg.image_url,
    type: a.type,
    episodes: a.episodes,
    year: a.year,
    genres: a.genres.map((g) => g.name),
    studios: a.studios.map((s) => s.name),
  };
}
