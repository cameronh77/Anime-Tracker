import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { library, useLibrary } from '../store/library';

export default function Lists() {
  const lists = useLibrary((s) => s.lists);
  const entries = useLibrary((s) => s.entries);
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [ranked, setRanked] = useState(false);

  function create(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const id = library.createList(name.trim(), '', ranked);
    navigate(`/lists/${id}`);
  }

  return (
    <div className="page">
      <h1 className="section-title">Lists</h1>

      <form onSubmit={create} className="row wrap gap new-list">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New list name, e.g. Best of the 2000s" />
        <label className="check">
          <input type="checkbox" checked={ranked} onChange={(e) => setRanked(e.target.checked)} /> Ranked
        </label>
        <button className="btn" disabled={!name.trim()}>Create list</button>
      </form>

      {lists.length === 0 && <p className="muted">No lists yet. Make one, then add anime to it from any anime's page.</p>}

      <div className="list-cards">
        {lists.map((l) => (
          <Link key={l.id} to={`/lists/${l.id}`} className="list-card">
            <div className="stack">
              {l.animeIds.slice(0, 5).map((id) => {
                const a = entries[id]?.anime;
                return a ? <img key={id} src={a.image} alt="" /> : null;
              })}
              {l.animeIds.length === 0 && <div className="stack-empty" />}
            </div>
            <div className="strong">{l.name}</div>
            <div className="small muted">
              {l.animeIds.length} anime{l.ranked && ' · ranked'}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
