import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getAnime, snapshot } from '../api/jikan';
import LogModal from '../components/LogModal';
import StarRating from '../components/StarRating';
import Review from '../components/Review';
import { useAsync } from '../hooks/useAsync';
import { library, useLibrary } from '../store/library';
import { STATUS_LABELS, type WatchStatus } from '../types';
import { cap, fmtDate, formatStars } from '../utils';

export default function AnimeDetail() {
  const id = Number(useParams().id);
  const { data: anime, loading, error } = useAsync(() => getAnime(id), [id]);

  const entry = useLibrary((s) => s.entries[id]);
  const diary = useLibrary((s) => s.diary);
  const lists = useLibrary((s) => s.lists);
  const favourites = useLibrary((s) => s.favourites);
  const logs = useMemo(() => diary.filter((d) => d.animeId === id), [diary, id]);

  const [logging, setLogging] = useState(false);
  const [showLists, setShowLists] = useState(false);
  const [notice, setNotice] = useState('');

  if (loading) return <div className="page"><p className="muted">Loading…</p></div>;
  if (error || !anime) return <div className="page"><p className="muted">Couldn't load this anime. {error?.message}</p></div>;

  const snap = snapshot(anime);
  const isFav = favourites.includes(id);
  const eps = entry?.episodesWatched ?? 0;
  const total = anime.episodes;

  function toggleFav() {
    if (!library.toggleFavourite(snap)) setNotice('You can pick up to 4 favourites. Remove one from your profile first.');
    else setNotice('');
  }

  return (
    <div className="page detail">
      <div className="detail-backdrop" style={{ backgroundImage: `url(${snap.image})` }} />

      <div className="detail-grid">
        <aside>
          <img className="detail-poster" src={snap.image} alt={snap.title} />
          {anime.score && (
            <div className="muted small center">
              MAL score <strong className="gold">{anime.score.toFixed(2)}</strong>
            </div>
          )}
        </aside>

        <main>
          <h1>{snap.title}</h1>
          <div className="muted">
            {[anime.title_english && anime.title !== anime.title_english ? anime.title : null, anime.title_japanese]
              .filter(Boolean)
              .join(' · ')}
          </div>
          <div className="meta-line">
            {[
              anime.season && anime.year ? `${cap(anime.season)} ${anime.year}` : snap.year,
              anime.type,
              total ? `${total} episodes` : anime.airing ? 'Airing' : null,
              anime.duration,
              anime.status,
            ]
              .filter(Boolean)
              .join(' · ')}
          </div>
          {anime.studios.length > 0 && (
            <div className="meta-line">Studio: {anime.studios.map((s) => s.name).join(', ')}</div>
          )}
          <div className="chips">
            {[...anime.genres, ...(anime.themes ?? [])].map((g) => (
              <span key={g.mal_id} className="chip">{g.name}</span>
            ))}
          </div>
          <p className="synopsis">{anime.synopsis?.replace(/\[Written by MAL Rewrite\]/, '').trim()}</p>

          {anime.trailer?.youtube_id && (
            <a className="muted small" href={`https://www.youtube.com/watch?v=${anime.trailer.youtube_id}`} target="_blank" rel="noreferrer">
              ▶ Watch trailer
            </a>
          )}

          {logs.length > 0 && (
            <section>
              <h3 className="section-title">Your activity</h3>
              <ul className="log-list">
                {logs.map((l) => (
                  <li key={l.id}>
                    <div className="row between">
                      <span>
                        {l.rewatch ? 'Rewatched' : 'Watched'} {fmtDate(l.watchedOn)}{' '}
                        <span className="gold">{formatStars(l.rating)}</span>
                        {l.liked && <span className="heart"> ♥</span>}
                      </span>
                      <button className="link danger" onClick={() => library.deleteLog(l.id)}>Delete</button>
                    </div>
                    {l.review && <Review text={l.review} spoilers={l.spoilers} />}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </main>

        <aside className="panel">
          <div className="panel-row">
            <select
              value={entry?.status ?? ''}
              onChange={(e) => (e.target.value ? library.setStatus(snap, e.target.value as WatchStatus) : library.removeEntry(id))}
              aria-label="Watch status"
            >
              <option value="">Not in library</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div className="panel-row">
            <div className="small muted">Episodes</div>
            <div className="row gap center">
              <button className="btn ghost sm" onClick={() => library.setEpisodes(snap, eps - 1)} disabled={eps <= 0}>−</button>
              <span className="ep-count">
                {eps} / {total ?? '?'}
              </span>
              <button className="btn ghost sm" onClick={() => library.setEpisodes(snap, eps + 1)} disabled={!!total && eps >= total}>+</button>
            </div>
            {total ? <progress max={total} value={eps} /> : null}
          </div>

          <div className="panel-row center">
            <div className="small muted">Rating</div>
            <StarRating value={entry?.rating ?? null} onChange={(v) => library.setRating(snap, v)} size={30} />
          </div>

          <div className="panel-row row gap center">
            <button className={`like ${entry?.liked ? 'on' : ''}`} onClick={() => library.toggleLike(snap)} aria-pressed={!!entry?.liked}>
              ♥ <span className="small">Like</span>
            </button>
            <button className={`like ${isFav ? 'on gold-on' : ''}`} onClick={toggleFav} aria-pressed={isFav}>
              ★ <span className="small">Favourite</span>
            </button>
          </div>
          {notice && <div className="small muted">{notice}</div>}

          <button className="btn block" onClick={() => setLogging(true)}>Log or review…</button>
          <button className="btn ghost block" onClick={() => setShowLists(!showLists)}>Add to a list…</button>

          {showLists && (
            <div className="list-picker">
              {lists.length === 0 && (
                <p className="small muted">
                  No lists yet. <Link to="/lists">Create one</Link>.
                </p>
              )}
              {lists.map((l) => (
                <label key={l.id} className="check">
                  <input type="checkbox" checked={l.animeIds.includes(id)} onChange={() => library.toggleInList(l.id, snap)} />
                  {l.name}
                </label>
              ))}
            </div>
          )}
        </aside>
      </div>

      {logging && <LogModal anime={snap} onClose={() => setLogging(false)} />}
    </div>
  );
}
