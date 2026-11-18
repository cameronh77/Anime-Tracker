import { Link, useNavigate, useParams } from 'react-router-dom';
import { library, useLibrary } from '../store/library';

export default function ListDetail() {
  const { id } = useParams();
  const list = useLibrary((s) => s.lists.find((l) => l.id === id));
  const entries = useLibrary((s) => s.entries);
  const navigate = useNavigate();

  if (!list)
    return (
      <div className="page">
        <p className="muted">List not found. <Link to="/lists">Back to lists</Link></p>
      </div>
    );

  function remove() {
    if (list && confirm(`Delete “${list.name}”? This can't be undone.`)) {
      library.deleteList(list.id);
      navigate('/lists');
    }
  }

  return (
    <div className="page">
      <Link to="/lists" className="small muted">← All lists</Link>
      <input
        className="title-input"
        value={list.name}
        onChange={(e) => library.updateList(list.id, { name: e.target.value })}
        aria-label="List name"
      />
      <textarea
        rows={2}
        value={list.description}
        placeholder="Add a description…"
        onChange={(e) => library.updateList(list.id, { description: e.target.value })}
      />
      <div className="row gap wrap">
        <label className="check">
          <input type="checkbox" checked={list.ranked} onChange={(e) => library.updateList(list.id, { ranked: e.target.checked })} />
          Ranked list
        </label>
        <button className="link danger small" onClick={remove}>Delete list</button>
      </div>

      {list.animeIds.length === 0 ? (
        <p className="muted">Empty. Add anime from their page with <strong>Add to a list…</strong></p>
      ) : (
        <ol className="list-items">
          {list.animeIds.map((aid, i) => {
            const a = entries[aid]?.anime;
            if (!a) return null;
            return (
              <li key={aid}>
                {list.ranked && <span className="list-rank">{i + 1}</span>}
                <Link to={`/anime/${aid}`}><img src={a.image} alt="" className="thumb" /></Link>
                <div className="grow">
                  <Link to={`/anime/${aid}`} className="strong">{a.title}</Link>
                  <div className="small muted">{[a.year, a.type, a.studios[0]].filter(Boolean).join(' · ')}</div>
                </div>
                <div className="row gap">
                  <button className="btn ghost sm" onClick={() => library.moveInList(list.id, i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
                  <button className="btn ghost sm" onClick={() => library.moveInList(list.id, i, 1)} disabled={i === list.animeIds.length - 1} aria-label="Move down">↓</button>
                  <button className="btn ghost sm" onClick={() => library.toggleInList(list.id, a)} aria-label="Remove">✕</button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
