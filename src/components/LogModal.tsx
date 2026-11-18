import { useState } from 'react';
import type { AnimeSnapshot } from '../types';
import { library, today, useLibrary } from '../store/library';
import StarRating from './StarRating';

interface Props {
  anime: AnimeSnapshot;
  onClose: () => void;
}

export default function LogModal({ anime, onClose }: Props) {
  const entry = useLibrary((s) => s.entries[anime.mal_id]);
  const hasLogged = useLibrary((s) => s.diary.some((d) => d.animeId === anime.mal_id));

  const [watchedOn, setWatchedOn] = useState(today());
  const [rating, setRating] = useState<number | null>(entry?.rating ?? null);
  const [liked, setLiked] = useState(entry?.liked ?? false);
  const [rewatch, setRewatch] = useState(hasLogged);
  const [review, setReview] = useState('');
  const [spoilers, setSpoilers] = useState(false);

  function save() {
    library.log(anime, { watchedOn, rating, liked, rewatch, review: review.trim(), spoilers });
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`Log ${anime.title}`}>
        <div className="modal-head">
          <img src={anime.image} alt="" />
          <div>
            <div className="muted small">I watched…</div>
            <h2>{anime.title}</h2>
            <div className="muted small">
              {[anime.year, anime.type, anime.episodes && `${anime.episodes} eps`].filter(Boolean).join(' · ')}
            </div>
          </div>
        </div>

        <div className="row wrap gap">
          <label className="field">
            Finished on
            <input type="date" value={watchedOn} max={today()} onChange={(e) => setWatchedOn(e.target.value)} />
          </label>
          <label className="check">
            <input type="checkbox" checked={rewatch} onChange={(e) => setRewatch(e.target.checked)} />
            I've watched this before
          </label>
        </div>

        <textarea
          rows={6}
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Add a review… (optional)"
        />

        <div className="row wrap gap between">
          <div className="row gap">
            <StarRating value={rating} onChange={setRating} size={28} />
            <button type="button" className={`like ${liked ? 'on' : ''}`} onClick={() => setLiked(!liked)} aria-pressed={liked}>
              ♥
            </button>
          </div>
          <label className="check">
            <input type="checkbox" checked={spoilers} onChange={(e) => setSpoilers(e.target.checked)} />
            Contains spoilers
          </label>
        </div>

        <div className="row gap end">
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}
