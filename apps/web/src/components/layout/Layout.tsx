import { Search, UserRound, BookOpen, LogOut, ChevronDown, Settings, Menu, X } from 'lucide-react';
import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/Auth';
import { SearchSuggestions } from '../shared/SearchSuggestions';
const links = [
  ['Competitive Exams', '/exams'],
  ['Professional Skills', '/skills'],
  ['Teachers', '/teachers'],
];
export function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const profileButton = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, logout, loading } = useAuth();
  useEffect(() => {
    setOpen(false);
    setProfileOpen(false);
  }, [pathname]);
  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setProfileOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileOpen(false);
        setOpen(false);
        profileButton.current?.focus();
      }
    };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', escape);
    };
  }, []);
  function search(event: FormEvent) {
    event.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setOpen(false);
    }
  }
  const initials = user?.full_name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  return (
    <div className="min-h-screen">
      <header className="site-header">
        <div className="container-site flex h-20 items-center justify-between gap-2 sm:gap-4 lg:gap-6">
          <Link
            to="/"
            aria-label="Skillflix home"
            className="flex shrink-0 items-center gap-2 text-lg sm:text-xl font-bold tracking-tight text-white"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue text-lg font-bold">
              S
            </span>
            skillflix<span className="text-warm">.</span>
          </Link>
          <nav
            aria-label="Main navigation"
            className="hidden flex-1 items-center justify-evenly gap-2 lg:flex"
          >
            {links.map(([label, path]) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) => `nav-pill ${isActive ? 'nav-pill-active' : ''}`}
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <form
            role="search"
            onSubmit={search}
            className="nav-search relative ml-auto hidden min-w-0 w-60 items-center rounded-full border border-white/20 bg-white/10 px-3 sm:flex lg:ml-0"
          >
            <button
              type="submit"
              aria-label="Search"
              className="rounded-full p-1 text-white/70 hover:text-white"
            >
              <Search size={17} />
            </button>
            <input
              className="min-w-0 w-full bg-transparent px-3 py-3 text-sm text-white placeholder:text-white/60"
              aria-label="Search Skillflix"
              placeholder="Search learning paths"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <SearchSuggestions query={query} onSelect={() => setQuery('')} />
          </form>
          <button
            className="ml-auto rounded-lg p-2 text-white sm:ml-0 lg:hidden"
            aria-label={open ? 'Close navigation' : 'Open navigation'}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => {
              setOpen(!open);
              setProfileOpen(false);
            }}
          >
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
          {loading ? (
            <div
              className="h-10 w-24 animate-pulse rounded-full bg-white/10"
              aria-label="Checking account"
            />
          ) : !user ? (
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <Link to="/login" className="guest-login">
                Log in
              </Link>
              <Link to="/signup" className="guest-signup">
                Sign up{' '}
                <span className="hidden sm:inline" aria-hidden="true">
                  &rarr;
                </span>
              </Link>
            </div>
          ) : (
            <div className="relative shrink-0" ref={menuRef}>
              <button
                ref={profileButton}
                className="flex items-center gap-2 rounded-full p-1 text-white focus-visible:outline-white"
                aria-label="Open profile menu"
                aria-expanded={profileOpen}
                aria-controls="profile-navigation"
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setOpen(false);
                }}
              >
                <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full border-2 border-indigo-200 bg-[#e9e8ff] text-sm font-bold text-ink">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials || <UserRound size={20} />
                  )}
                </span>
                <ChevronDown size={14} className={profileOpen ? 'rotate-180' : ''} />
              </button>
              {profileOpen && (
                <div
                  id="profile-navigation"
                  className="absolute right-0 top-full z-50 mt-3 w-64 overflow-hidden rounded-2xl border border-border bg-white text-ink shadow-lg"
                >
                  <div className="border-b border-border px-5 py-4">
                    <p className="truncate text-sm font-semibold">
                      {user?.full_name || 'Welcome to Skillflix'}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted">
                      {user?.email || 'Your learning, all in one place.'}
                    </p>
                  </div>
                  <nav aria-label="Profile navigation" className="grid gap-1 p-2">
                    <Link className="profile-menu-link" to={user ? '/profile' : '/login'}>
                      <UserRound size={17} />
                      {user ? 'My Profile' : 'Log in'}
                    </Link>
                    <Link
                      className="profile-menu-link"
                      to={user ? '/my-learning' : '/login?returnTo=%2Fmy-learning'}
                    >
                      <BookOpen size={17} />
                      My Learning
                    </Link>
                    {user?.role === 'SUPER_ADMIN' && (
                      <Link className="profile-menu-link" to="/admin/dashboard">
                        <Settings size={17} />
                        Admin Dashboard
                      </Link>
                    )}
                    {!user && (
                      <Link className="profile-menu-link" to="/signup">
                        Create Account
                      </Link>
                    )}
                    {user && (
                      <button
                        className="profile-menu-link"
                        onClick={async () => {
                          try {
                            await logout();
                            setProfileOpen(false);
                            navigate('/');
                          } catch {
                            setError('Unable to log out. Please try again.');
                          }
                        }}
                      >
                        <LogOut size={17} />
                        Log out
                      </button>
                    )}
                  </nav>
                  {error && (
                    <p role="alert" className="p-3 text-sm text-red-700">
                      {error}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        {open && (
          <div id="mobile-navigation" className="container-site border-t border-white/15 pb-5">
            <nav aria-label="Mobile navigation" className="grid gap-2 pt-4 lg:hidden">
              {links.map(([label, path]) => (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) => `nav-pill ${isActive ? 'nav-pill-active' : ''}`}
                >
                  {label}
                </NavLink>
              ))}
            </nav>
            <form
              role="search"
              onSubmit={search}
              className="mt-4 flex items-center gap-2 rounded-xl bg-white p-2 sm:hidden"
            >
              <input
                className="min-w-0 flex-1 px-2 py-2 text-sm"
                aria-label="Search Skillflix"
                placeholder="Search learning paths"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button aria-label="Search" className="rounded-lg bg-blue p-2 text-white">
                <Search size={18} />
              </button>
            </form>
          </div>
        )}
      </header>
      {children}
      <footer className="mt-20 border-t border-border bg-white">
        <div className="container-site grid gap-8 py-12 md:grid-cols-3">
          <div>
            <p className="font-serif text-2xl text-blue">
              skillflix<span className="text-warm">.</span>
            </p>
            <p className="mt-3 max-w-xs text-sm leading-6 text-muted">
              A clearer way to discover learning resources and plan your next step.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">Explore</p>
            <div className="mt-3 grid gap-2 text-sm text-muted">
              <Link to="/exams">Competitive exams</Link>
              <Link to="/skills">Professional skills</Link>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold">Your space</p>
            <div className="mt-3 grid gap-2 text-sm text-muted">
              <Link to="/my-learning">Saved resources</Link>
              <Link to="/about">About Skillflix</Link>
              <Link to="/contact">Contact</Link>
              <Link to="/privacy">Privacy policy</Link>
              <Link to="/terms">Terms of service</Link>
            </div>
          </div>
        </div>
        <div className="container-site border-t border-border py-5 text-xs text-muted">
          © {new Date().getFullYear()} Skillflix. Learning progress is saved to your account.
        </div>
      </footer>
    </div>
  );
}
