import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/Auth';
import { useLearning } from '../../context/LearningState';
import {
  Search,
  Bookmark,
  ArrowUpRight,
  Menu,
  X,
  Home,
  Layers,
  BookOpen,
  User,
} from '../../design/Common';
const links = [
  ['Explore', '/categories'],
  ['Learning paths', '/paths'],
  ['Playlists', '/playlists'],
  ['My learning', '/my-learning'],
];
function Logo() {
  return (
    <Link className="logo" to="/" aria-label="Skillflix home">
      <span className="logomark" />
      skillflix<span className="logodot">.</span>
    </Link>
  );
}
export function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const { state } = useLearning();
  const navigate = useNavigate();
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  return (
    <div className="reference-app">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="header">
        <div className="nav-wrap">
          <Logo />
          <nav className="desktop-nav" aria-label="Main navigation">
            {links.map(([label, to]) => (
              <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="nav-actions">
            <Link className="icon-btn" to="/search" aria-label="Search">
              <Search className="icon" />
            </Link>
            <Link className="icon-btn save-nav" to="/saved" aria-label="Saved resources">
              <Bookmark className="icon" />
              {state.courseIds.length + state.resourceIds.length > 0 && (
                <sup>{state.courseIds.length + state.resourceIds.length}</sup>
              )}
            </Link>
            {user ? (
              <Link className="avatar" to="/profile" aria-label="Your profile">
                {user.full_name[0].toUpperCase()}
              </Link>
            ) : (
              <>
                <Link className="text-link auth-login-link" to="/login">
                  Log in
                </Link>
                <Link className="btn small" to="/signup">
                  Get started <ArrowUpRight className="icon" />
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
              A little less searching.
              <br />A little more possibility.
            </p>
          </div>
          <div>
            <b>DISCOVER</b>
            <Link to="/categories">Explore categories</Link>
            <Link to="/paths">Learning paths</Link>
            <Link to="/playlists">Curated playlists</Link>
            <Link to="/teachers">Teachers</Link>
            <Link to="/exams">Competitive exams</Link>
          </div>
          <div>
            <b>YOUR SPACE</b>
            <Link to="/my-learning">My learning</Link>
            <Link to="/saved">Saved resources</Link>
            <Link to="/profile">Your profile</Link>
          </div>
          <div>
            <b>SKILLFLIX</b>
            <Link to="/about">About Skillflix</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/privacy">Privacy policy</Link>
            <Link to="/terms">Terms of service</Link>
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
          [BookOpen, 'Learning', '/my-learning'],
          [Bookmark, 'Saved', '/saved'],
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
