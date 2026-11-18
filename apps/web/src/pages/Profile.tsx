import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/Auth';
export function Profile() {
  const { user, loading, logout, updateProfile } = useAuth();
  const [name, setName] = useState(user?.full_name || '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      await updateProfile(name, 'en');
      setMessage('Profile saved');
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save profile');
    }
  }
  if (loading) return <main className="container-site py-20">Loading profile…</main>;
  if (!user)
    return (
      <main className="container-site py-20">
        <h1 className="text-4xl">Sign in to view your profile.</h1>
        <Link to="/login?returnTo=%2Fprofile" className="button-primary mt-6">
          Log in
        </Link>
      </main>
    );
  return (
    <main className="container-site max-w-4xl py-14">
      <p className="eyebrow">Your account</p>
      <h1 className="mt-4 text-5xl">Profile</h1>
      <div className="mt-9 grid gap-8 md:grid-cols-[220px_1fr]">
        <aside className="card h-fit">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-blue text-3xl text-white">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              user.full_name.slice(0, 1).toUpperCase()
            )}
          </div>
          <p className="mt-4 font-semibold">{user.full_name}</p>
          <p className="mt-1 break-all text-sm text-muted">{user.email}</p>
          <p className="mt-5 text-xs text-muted">
            Joined {new Date(user.created_at).toLocaleDateString()}
          </p>
        </aside>
        <div className="card">
          <h2 className="text-3xl">Account details</h2>
          <form onSubmit={submit} className="mt-6 space-y-5">
            <label className="block text-sm font-medium">
              Full name
              <input
                className="input mt-2"
                value={name}
                minLength={2}
                maxLength={120}
                required
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="block text-sm font-medium">
              Email
              <input
                className="input mt-2"
                value={user.email}
                readOnly
                aria-describedby="email-note"
              />
            </label>
            <p id="email-note" className="text-xs text-muted">
              Email changes are not available yet.
            </p>
            {message && (
              <p role="status" className="text-sm text-blue">
                {message}
              </p>
            )}
            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
            <button className="button-primary">Save profile</button>
          </form>
          <div className="mt-9 border-t border-border pt-6">
            <h2 className="text-2xl">Your learning</h2>
            <p className="mt-2 text-sm text-muted">
              See saved roadmaps, completed topics, and bookmarked lessons.
            </p>
            <Link className="button-outline mt-4" to="/my-learning">
              Open My Learning
            </Link>
          </div>
          <button
            className="mt-8 block text-sm font-semibold text-blue underline"
            onClick={async () => {
              await logout();
              navigate('/');
            }}
          >
            Log out
          </button>
        </div>
      </div>
    </main>
  );
}
