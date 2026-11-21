import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/Auth';
import { useLearning } from '../../context/LearningState';
import { SearchSuggestions } from '../shared/SearchSuggestions';
import { Search, Bookmark, Menu, X, Home, Layers, BookOpen, User } from '../../design/Common';
import { figmaAssets } from '../../design/FigmaAssets';
const links = [
  ['Home', '/'],
  ['Explore', '/categories'],
  ['Paths', '/paths'],
  ['Playlists', '/playlists'],
  ['Creators', '/teachers'],
  ['Community', '/about'],
];
function Logo() {
  return (
    <Link className="logo" to="/" aria-label="Skillflix home">
      <span className="figma-logo-mark">
        <img src={figmaAssets.logo} alt="" />
        <span>▶</span>
      </span>
      <span>
        Skill<span className="figma-wordmark-accent">Flix</span>
      </span>
    </Link>
  );
}
export function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { pathname, search: currentSearch } = useLocation();
  const { user, logout } = useAuth();
  const { state } = useLearning();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setQuery(pathname === '/search' ? new URLSearchParams(currentSearch).get('q') || '' : '');
  }, [pathname, currentSearch]);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', shortcut);
    return () => document.removeEventListener('keydown', shortcut);
  }, []);
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  return (
    <div
      className={`reference-app figma-app ${pathname === '/' ? 'figma-home-shell' : 'figma-inner-shell'} ${/^\/(login|signup|signin)/.test(pathname) ? 'figma-auth-shell' : ''} ${/^\/(my-learning|saved|profile)/.test(pathname) ? 'figma-account-shell' : ''}`}
    >
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="header">
        <div className="nav-wrap">
          <Logo />
          <nav className="desktop-nav" aria-label="Main navigation">
            {links.map(([label, to]) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="nav-actions">
            <form
              className="concept-nav-search"
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
                searchRef.current?.blur();
              }}
            >
              <Search className="icon" />
              <input
                ref={searchRef}
                aria-label="Search skills, topics, or playlists"
                placeholder="Search for skills, topics or playlists..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <kbd>Ctrl K</kbd>
              <SearchSuggestions query={query} onSelect={() => setQuery('')} />
            </form>
            <Link className="icon-btn concept-mobile-search" to="/search" aria-label="Search">
              <Search className="icon" />
            </Link>
            {user && (
              <Link className="figma-my-learning" to="/my-learning">
                My Learning
              </Link>
            )}
            {user && (
              <Link className="icon-btn save-nav" to="/saved" aria-label="Saved resources">
                <Bookmark className="icon" />
                {state.courseIds.length + state.resourceIds.length > 0 && (
                  <sup>{state.courseIds.length + state.resourceIds.length}</sup>
                )}
              </Link>
            )}
            {user ? (
              <Link className="avatar" to="/profile" aria-label="Your profile">
                {user.full_name[0].toUpperCase()}
              </Link>
            ) : (
              <>
                <Link className="text-link auth-login-link" to="/login">
                  Sign in
                </Link>
                <Link className="btn small" to="/signup">
                  Sign up
                </Link>
              </>
            )}
            <button
              className="icon-btn menu-toggle"
              aria-label={open ? 'Close navigation' : 'Open navigation'}
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              {open ? <X className="icon" /> : <Menu className="icon" />}
            </button>
          </div>
        </div>
        <nav className={`mobile-menu ${open ? 'open' : ''}`} aria-label="Mobile navigation">
          {links.map(([label, to]) => (
            <Link key={to} to={to}>
              {label}
            </Link>
          ))}
          <Link to="/exams">Competitive exams</Link>
          <Link to="/teachers">Teachers</Link>
          {user ? (
            <>
              <Link to="/profile">Profile</Link>
              {user.role === 'SUPER_ADMIN' && <Link to="/admin/dashboard">Admin dashboard</Link>}
              <button
                onClick={async () => {
                  await logout();
                  navigate('/');
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <Link to="/login">Log in</Link>
          )}
        </nav>
      </header>
      <main id="main">{children}</main>
      <footer className="footer">
        <div className="container footer-top">
          <div>
            <Logo />
            <p>
              Your companion for free
              <br />
              and structured learning.
            </p>
          </div>
          <div>
            <b>Explore</b>
            <Link to="/categories">Explore categories</Link>
            <Link to="/paths">Learning paths</Link>
            <Link to="/playlists">Curated playlists</Link>
            <Link to="/teachers">Teachers</Link>
            <Link to="/exams">Competitive exams</Link>
          </div>
          <div>
            <b>Your learning</b>
            <Link to="/my-learning">My learning</Link>
            <Link to="/saved">Saved resources</Link>
            <Link to="/profile">Your profile</Link>
          </div>
          <div>
            <b>Company</b>
            <Link to="/about">About Skillflix</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/privacy">Privacy policy</Link>
            <Link to="/terms">Terms of service</Link>
          </div>
          <div className="figma-footer-legal">
            <b>Legal</b>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Use</Link>
          </div>
          <div className="figma-footer-connect">
            <b>Stay Connected</b>
            <Link to="/teachers">Meet the creators</Link>
            <Link to="/contact">Contact Skillflix</Link>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>Skillflix / Learn with direction</span>
          <span>Curated resources / Progress synced to your account</span>
        </div>
      </footer>
      <nav className="bottom-nav" aria-label="Quick navigation">
        {[
          [Home, 'Home', '/'],
          [Layers, 'Explore', '/categories'],
          [BookOpen, 'Paths', '/paths'],
          ...(user ? [[Bookmark, 'Saved', '/saved']] : []),
          [User, 'Profile', user ? '/profile' : '/login'],
        ].map(([Icon, label, to]) => {
          const I = Icon as typeof User;
          return (
            <NavLink
              key={to as string}
              to={to as string}
              end
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <I className="icon" />
              <span>{label as string}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
