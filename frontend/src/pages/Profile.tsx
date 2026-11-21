import { useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import AnimeCard from '../components/AnimeCard';
import { library, useLibrary } from '../store/library';

export default function Profile() {
  const username = useLibrary((s) => s.username);
  const entries = useLibrary((s) => s.entries);
  const diary = useLibrary((s) => s.diary);
  const favourites = useLibrary((s) => s.favourites);
  const lists = useLibrary((s) => s.lists);
  const fileRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    const all = Object.values(entries);
    const completed = all.filter((e) => e.status === 'completed');
    const episodes = all.reduce((n, e) => n + e.episodesWatched, 0);
    const thisYear = String(new Date().getFullYear());
    const ratings = Array.from({ length: 10 }, (_, i) => all.filter((e) => e.rating === (i + 1) / 2).length);
    const genres = new Map<string, number>();
    const studios = new Map<string, number>();
    for (const e of completed) {
      e.anime.genres.forEach((g) => genres.set(g, (genres.get(g) ?? 0) + 1));
      e.anime.studios.forEach((s) => studios.set(s, (studios.get(s) ?? 0) + 1));
    }
    const top = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    return {
      completed: completed.length,
      episodes,
      thisYear: diary.filter((d) => d.watchedOn.startsWith(thisYear)).length,
      reviews: diary.filter((d) => d.review).length,
      ratings,
      genres: top(genres),
      studios: top(studios),
    };
  }, [entries, diary]);

  const maxRating = Math.max(1, ...stats.ratings);
  const recent = diary.slice(0, 6);

  function exportData() {
    const blob = new Blob([library.exportJson()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `kansou-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function importData(file?: File) {
    if (!file) return;
    try {
      library.importJson(await file.text());
    } catch (e) {
      alert(`Import failed: ${(e as Error).message}`);
    }
  }

  return (
    <div className="page">
      <div className="profile-head">
        <div className="avatar">{username[0]?.toUpperCase()}</div>
        <input
          className="title-input"
          defaultValue={username}
          onBlur={(e) => library.setUsername(e.target.value)}
          aria-label="Username"
        />
      </div>

      <div className="stat-row">
        <Stat n={stats.completed} label="Completed" />
        <Stat n={stats.episodes} label="Episodes" />
        <Stat n={stats.thisYear} label="This year" />
        <Stat n={stats.reviews} label="Reviews" />
        <Stat n={lists.length} label="Lists" />
      </div>

      <section>
        <h3 className="section-title">Favourite anime</h3>
        {favourites.length === 0 ? (
          <p className="muted small">Mark up to 4 favourites with ★ on an anime's page.</p>
        ) : (
          <div className="grid four">
            {favourites.map((id) => {
              const a = entries[id]?.anime;
              return a ? <AnimeCard key={id} id={id} title={a.title} image={a.image} /> : null;
            })}
          </div>
        )}
      </section>

      <div className="two-col">
        <section>
          <h3 className="section-title">Ratings</h3>
          <div className="histogram" aria-label="Ratings distribution">
            {stats.ratings.map((n, i) => (
              <div key={i} className="bar" style={{ height: `${(n / maxRating) * 100}%` }} title={`${(i + 1) / 2}★: ${n}`} />
            ))}
          </div>
          <div className="row between small muted"><span>½★</span><span>★★★★★</span></div>
        </section>
        <section>
          <h3 className="section-title">Top genres</h3>
          <Ranked items={stats.genres} />
          <h3 className="section-title">Top studios</h3>
          <Ranked items={stats.studios} />
        </section>
      </div>

      <section>
        <div className="row between">
          <h3 className="section-title">Recent activity</h3>
          <Link to="/diary" className="small">Full diary →</Link>
        </div>
        {recent.length === 0 ? (
          <p className="muted small">No logs yet.</p>
        ) : (
          <div className="grid six">
            {recent.map((d) => {
              const a = entries[d.animeId]?.anime;
              return a ? <AnimeCard key={d.id} id={a.mal_id} title={a.title} image={a.image} /> : null;
            })}
          </div>
        )}
      </section>

      <section className="row gap wrap">
        <button className="btn ghost" onClick={exportData}>Export data</button>
        <button className="btn ghost" onClick={() => fileRef.current?.click()}>Import data</button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => importData(e.target.files?.[0])} />
      </section>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="stat">
      <div className="stat-n">{n.toLocaleString()}</div>
      <div className="small muted">{label}</div>
    </div>
  );
}

function Ranked({ items }: { items: [string, number][] }) {
  if (!items.length) return <p className="muted small">Complete some anime to see this.</p>;
  return (
    <ol className="ranked">
      {items.map(([name, n]) => (
        <li key={name}><span>{name}</span><span className="muted">{n}</span></li>
      ))}
    </ol>
  );
}
