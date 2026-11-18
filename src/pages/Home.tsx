import { useState } from 'react';
import { getSeasonNow, getTopAnime } from '../api/jikan';
import AnimeGrid from '../components/AnimeGrid';
import { useAsync } from '../hooks/useAsync';
import { useLibrary } from '../store/library';

const TABS = [
  { key: 'season', label: 'This season' },
  { key: 'top', label: 'Top rated' },
  { key: 'airing', label: 'Top airing' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'popular', label: 'Most popular' },
] as const;
type Tab = (typeof TABS)[number]['key'];

export default function Home() {
  const [tab, setTab] = useState<Tab>('season');
  const username = useLibrary((s) => s.username);
  const logCount = useLibrary((s) => s.diary.length);

  const result = useAsync(() => {
    switch (tab) {
      case 'season': return getSeasonNow();
      case 'top': return getTopAnime();
      case 'airing': return getTopAnime('airing');
      case 'upcoming': return getTopAnime('upcoming');
      case 'popular': return getTopAnime('bypopularity');
    }
  }, [tab]);

  return (
    <div className="page">
      <section className="hero">
        <h1>
          {logCount ? `Welcome back, ${username}.` : 'Track the anime you watch.'}
        </h1>
        <p className="muted">
          Log every series you finish, rate it, review it, and keep track of where you're up to in what you're watching.
        </p>
      </section>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      <AnimeGrid {...result} anime={result.data} ranked={tab !== 'season'} />
    </div>
  );
}
