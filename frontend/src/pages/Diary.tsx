import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Review from '../components/Review';
import { library, useLibrary } from '../store/library';
import { fmtDate, formatStars } from '../utils';

export default function Diary() {
  const diary = useLibrary((s) => s.diary);
  const entries = useLibrary((s) => s.entries);

  // Group logs by month, newest first.
  const months = useMemo(() => {
    const sorted = [...diary].sort((a, b) => b.watchedOn.localeCompare(a.watchedOn) || b.createdAt.localeCompare(a.createdAt));
    const groups = new Map<string, typeof diary>();
    for (const d of sorted) {
      const key = d.watchedOn.slice(0, 7);
      groups.set(key, [...(groups.get(key) ?? []), d]);
    }
    return [...groups.entries()];
  }, [diary]);

  if (!diary.length)
    return (
      <div className="page">
        <h1 className="section-title">Diary</h1>
        <p className="muted">
          Nothing logged yet. Open any anime and hit <strong>Log or review…</strong> when you finish it.{' '}
          <Link to="/">Find something to watch</Link>.
        </p>
      </div>
    );

  return (
    <div className="page">
      <h1 className="section-title">Diary</h1>
      {months.map(([month, logs]) => (
        <section key={month} className="diary-month">
          <h2>{new Date(month + '-01T00:00').toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2>
          {logs.map((l) => {
            const a = entries[l.animeId]?.anime;
            return (
              <div key={l.id} className="diary-row">
                <div className="diary-day">{Number(l.watchedOn.slice(8))}</div>
                {a && <Link to={`/anime/${a.mal_id}`}><img src={a.image} alt="" className="thumb" /></Link>}
                <div className="grow">
                  <div className="row between">
                    <Link to={`/anime/${l.animeId}`} className="strong">{a?.title ?? `Anime #${l.animeId}`}</Link>
                    <button className="link danger small" onClick={() => library.deleteLog(l.id)}>Delete</button>
                  </div>
                  <div className="small muted">
                    {fmtDate(l.watchedOn)}
                    {l.rewatch && ' · rewatch'}
                    {' '}<span className="gold">{formatStars(l.rating)}</span>
                    {l.liked && <span className="heart"> ♥</span>}
                  </div>
                  {l.review && <Review text={l.review} spoilers={l.spoilers} />}
                </div>
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
