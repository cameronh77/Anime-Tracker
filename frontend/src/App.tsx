import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import AnimeDetail from './pages/AnimeDetail';
import Diary from './pages/Diary';
import Home from './pages/Home';
import Library from './pages/Library';
import ListDetail from './pages/ListDetail';
import Lists from './pages/Lists';
import Profile from './pages/Profile';
import Search from './pages/Search';
import SignIn from './pages/SignIn';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/anime/:id" element={<AnimeDetail />} />
        <Route path="/diary" element={<Diary />} />
        <Route path="/library" element={<Library />} />
        <Route path="/lists" element={<Lists />} />
        <Route path="/lists/:id" element={<ListDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="*" element={<div className="page"><p className="muted">Page not found.</p></div>} />
      </Routes>
      <footer className="footer muted small">
        Anime data from <a href="https://anilist.co" target="_blank" rel="noreferrer">AniList</a>. Your data is stored in this browser.
      </footer>
    </BrowserRouter>
  );
}
