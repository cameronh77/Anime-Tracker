import { useState, type FormEvent } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  function submit(e: FormEvent) {
    e.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <header className="nav">
      <div className="nav-inner">
        <NavLink to="/" className="logo">
          感想 <span>kansou</span>
        </NavLink>
        <nav>
          <NavLink to="/" end>Discover</NavLink>
          <NavLink to="/diary">Diary</NavLink>
          <NavLink to="/library">Library</NavLink>
          <NavLink to="/lists">Lists</NavLink>
          <NavLink to="/profile">Profile</NavLink>
        </nav>
        <form onSubmit={submit} className="nav-search">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search anime…" aria-label="Search anime" />
        </form>
      </div>
    </header>
  );
}
