import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AnimeCard from '../components/AnimeCard';
import { useLibrary } from '../store/library';
import { STATUS_LABELS, type WatchStatus } from '../types';

type Sort = 'updated' | 'rating' | 'title' | 'year';

export default function Library() {
  const entries = useLibrary((s) => s.entries);
  const [status, setStatus] = useState<WatchStatus>('watching');
  const [sort, setSort] = useState<Sort>('updated');

  const all = useMemo(() => Object.values(entries), [entries]);
  const counts = useMemo(() => {
    const c = {} as Record<WatchStatus, number>;
    for (const e of all) c[e.status] = (c[e.status] ?? 0) + 1;
    return c;
  }, [all]);

  const shown = useMemo(() => {
    const list = all.filter((e) => e.status === status);
    const cmp: Record<Sort, (a: (typeof list)[0], b: (typeof list)[0]) => number> = {
      updated: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
      rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
      title: (a, b) => a.anime.title.localeCompare(b.anime.title),
      year: (a, b) => (b.anime.year ?? 0) - (a.anime.year ?? 0),
    };
    return list.sort(cmp[sort]);
  }, [all, status, sort]);

  return (
    <div className="page">
      <div className="row between wrap gap">
        <h1 className="section-title">Library</h1>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort">
          <option value="updated">Recently updated</option>
          <option value="rating">Your rating</option>
          <option value="title">Title</option>
          <option value="year">Release year</option>
        </select>
      </div>

      <div className="tabs">
        {(Object.keys(STATUS_LABELS) as WatchStatus[]).map((k) => (
          <button key={k} className={status === k ? 'active' : ''} onClick={() => setStatus(k)}>
            {STATUS_LABELS[k]} <span className="muted">{counts[k] ?? 0}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="muted">
          Nothing here yet. <Link to="/">Browse anime</Link> and set a status on its page.
        </p>
      ) : (
        <div className="grid">
          {shown.map((e) => (
            <AnimeCard
              key={e.anime.mal_id}
              id={e.anime.mal_id}
              title={e.anime.title}
              image={e.anime.image}
              subtitle={
                status === 'watching' || status === 'on_hold'
                  ? `Ep ${e.episodesWatched}/${e.anime.episodes ?? '?'}`
                  : [e.anime.year, e.anime.type].filter(Boolean).join(' · ')
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
