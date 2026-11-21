import { useState, type FormEvent } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { signOut, useSession } from '../api/auth';

function NavUser() {
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();

  if (isPending) return null;
  if (!session) {
    return (
      <Link to="/signin" className="btn sm">
        Sign in
      </Link>
    );
  }

  const { name } = session.user;
  return (
    <div className="nav-user">
      <span className="avatar-sm" aria-hidden>{name[0]?.toUpperCase()}</span>
      <span>{name}</span>
      <button
        className="link small"
        onClick={async () => {
          await signOut();
          navigate('/');
        }}
      >
        Sign out
      </button>
    </div>
  );
}

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
        <NavUser />
      </div>
    </header>
  );
}
