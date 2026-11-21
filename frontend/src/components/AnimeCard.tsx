import { Link } from 'react-router-dom';
import { useLibrary } from '../store/library';
import { formatStars } from '../utils';

interface Props {
  id: number;
  title: string;
  image: string;
  subtitle?: string;
  rank?: number;
}

export default function AnimeCard({ id, title, image, subtitle, rank }: Props) {
  const entry = useLibrary((s) => s.entries[id]);

  return (
    <Link to={`/anime/${id}`} className="card" title={title}>
      <div className="poster">
        <img src={image} alt="" loading="lazy" />
        {rank != null && <span className="rank">{rank}</span>}
        {entry && entry.status !== 'plan_to_watch' && <span className={`dot status-${entry.status}`} />}
      </div>
      <div className="card-title">{title}</div>
      <div className="card-meta">
        {entry?.rating ? <span className="gold">{formatStars(entry.rating)}</span> : subtitle}
        {entry?.liked && <span className="heart"> ♥</span>}
      </div>
    </Link>
  );
}
