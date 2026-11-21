import type { Anime } from '../types';
import AnimeCard from './AnimeCard';

interface Props {
  anime?: Anime[];
  loading?: boolean;
  error?: Error;
  ranked?: boolean;
}

export default function AnimeGrid({ anime, loading, error, ranked }: Props) {
  if (error) return <p className="muted">Couldn't load anime: {error.message}</p>;
  if (loading) return <div className="grid">{Array.from({ length: 12 }, (_, i) => <div key={i} className="card skeleton" />)}</div>;
  if (!anime?.length) return <p className="muted">Nothing found.</p>;

  return (
    <div className="grid">
      {anime.map((a, i) => (
        <AnimeCard
          key={a.mal_id}
          id={a.mal_id}
          title={a.title_english || a.title}
          image={a.images.jpg.large_image_url || a.images.jpg.image_url}
          subtitle={[a.year, a.type].filter(Boolean).join(' · ')}
          rank={ranked ? i + 1 : undefined}
        />
      ))}
    </div>
  );
}
