import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { request } from '../services/api';
import { useAdminData } from './useAdminData';
type Counts = Record<
  | 'users'
  | 'courses'
  | 'exams'
  | 'skills'
  | 'teachers'
  | 'roadmaps'
  | 'videos'
  | 'playlists'
  | 'published'
  | 'drafts',
  string
>;
interface Dashboard {
  counts: Counts;
  recentRegistrations: Array<{ id: string; full_name: string; email: string; created_at: string }>;
  recentCourses: Array<{ id: string; title: string; kind: string; status: string }>;
  recentUpdates: Array<{
    id: string;
    title: string;
    kind: string;
    status: string;
    updated_at: string;
  }>;
}
const date = (value: string | null) => (value ? new Date(value).toLocaleDateString() : '—');
export function AdminDashboard() {
  const { data, loading, error } = useAdminData<Dashboard>('/dashboard');
  return (
    <div>
      <p className="eyebrow">Overview</p>
      <h1 className="mt-3 text-4xl">Dashboard</h1>
      {loading ? (
        <p className="mt-8 text-muted">Loading actual platform data…</p>
      ) : error ? (
        <p role="alert" className="mt-8 text-red-700">
          {error}
        </p>
      ) : (
        data && (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {Object.entries(data.counts).map(([key, value]) => (
                <div className="card" key={key}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">{key}</p>
                  <p className="mt-3 text-3xl font-semibold text-blue">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-9 grid gap-6 xl:grid-cols-3">
              {[
                [
                  'Recent registrations',
                  data.recentRegistrations.map((x) => `${x.full_name} · ${date(x.created_at)}`),
                ],
                ['Recent courses', data.recentCourses.map((x) => `${x.title} · ${x.status}`)],
                [
                  'Recently updated',
                  data.recentUpdates.map((x) => `${x.title} · ${date(x.updated_at)}`),
                ],
              ].map(([title, items]) => (
                <section key={title as string} className="card">
                  <h2 className="text-2xl">{title as string}</h2>
                  {(items as string[]).length ? (
                    <ul className="mt-4 divide-y divide-border text-sm">
                      {(items as string[]).map((item, i) => (
                        <li className="py-3" key={i}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 text-sm text-muted">No records yet.</p>
                  )}
                </section>
              ))}
            </div>
            <p className="mt-6 text-sm text-muted">
              Course access ranking appears once reliable access tracking is available.
            </p>
          </>
        )
      )}
    </div>
  );
}
interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'SUSPENDED';
  created_at: string;
  last_active_at: string | null;
}
interface UsersPage {
  items: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
}
export function AdminUsers() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<{
    user: AdminUser;
    summary: { savedCourses: number; completedTopics: number; completedLessons: number };
  } | null>(null);
  const [message, setMessage] = useState('');
  const path = `/users?q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}&page=${page}`;
  const { data, loading, error, refresh } = useAdminData<UsersPage>(path);
  async function show(id: string) {
    setSelected(id);
    try {
      setDetail(await request(`/admin/users/${id}`));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to load user');
    }
  }
  async function change(user: AdminUser) {
    if (!confirm(`${user.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'} ${user.email}?`)) return;
    try {
      await request(`/admin/users/${user.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' }),
      });
      setMessage('Account status updated');
      await refresh();
      if (selected === user.id) await show(user.id);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to update user');
    }
  }
  return (
    <div>
      <p className="eyebrow">People</p>
      <h1 className="mt-3 text-4xl">Users</h1>
      <div className="mt-7 flex flex-wrap gap-3">
        <input
          className="input max-w-sm"
          aria-label="Search users"
          placeholder="Search name or email"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <select
          className="input max-w-48"
          aria-label="Account status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>
      {message && (
        <p role="status" className="mt-4 text-sm text-blue">
          {message}
        </p>
      )}
      {loading ? (
        <p className="mt-8">Loading users…</p>
      ) : error ? (
        <p role="alert" className="mt-8 text-red-700">
          {error}
        </p>
      ) : (
        <>
          <p className="mt-5 text-sm text-muted">{data?.total || 0} users</p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-softblue/40 text-xs uppercase text-muted">
                <tr>
                  {['Name', 'Email', 'Registered', 'Role', 'Status', 'Last active', 'Actions'].map(
                    (x) => (
                      <th className="px-4 py-3" key={x}>
                        {x}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {data?.items.map((user) => (
                  <tr className="border-t border-border" key={user.id}>
                    <td className="px-4 py-3">{user.full_name}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">{date(user.created_at)}</td>
                    <td className="px-4 py-3">{user.role}</td>
                    <td className="px-4 py-3">{user.status}</td>
                    <td className="px-4 py-3">{date(user.last_active_at)}</td>
                    <td className="px-4 py-3">
                      <button className="text-blue underline" onClick={() => show(user.id)}>
                        View
                      </button>
                      {user.role === 'USER' && (
                        <button className="ml-3 text-blue underline" onClick={() => change(user)}>
                          {user.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-5 flex items-center gap-4">
            <button
              className="button-outline"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <span className="text-sm">Page {page}</span>
            <button
              className="button-outline"
              disabled={page * (data?.pageSize || 20) >= (data?.total || 0)}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
      {detail && (
        <section className="card mt-8" aria-label="User details">
          <div className="flex justify-between">
            <h2 className="text-2xl">{detail.user.full_name}</h2>
            <button
              onClick={() => {
                setSelected(null);
                setDetail(null);
              }}
              aria-label="Close user details"
            >
              ×
            </button>
          </div>
          <p className="mt-2 text-sm text-muted">{detail.user.email}</p>
          <p className="mt-4 text-sm">
            Saved courses: {detail.summary.savedCourses} · Completed topics:{' '}
            {detail.summary.completedTopics} · Completed lessons: {detail.summary.completedLessons}
          </p>
        </section>
      )}
    </div>
  );
}
interface Category {
  id: string;
  name: string;
  status: 'Draft' | 'Published' | 'Archived';
}
export function AdminCategories() {
  const { data, loading, error, refresh } = useAdminData<Category[]>('/categories');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<Category['status']>('Draft');
  const [selected, setSelected] = useState<Category | null>(null);
  const [message, setMessage] = useState('');
  async function save(e: FormEvent) {
    e.preventDefault();
    try {
      const id = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      await request(`/admin/categories${selected ? `/${selected.id}` : ''}`, {
        method: selected ? 'PUT' : 'POST',
        body: JSON.stringify(selected ? { name, status } : { id, name, status }),
      });
      setMessage('Category saved');
      setName('');
      setStatus('Draft');
      setSelected(null);
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to save category');
    }
  }
  return (
    <div>
      <p className="eyebrow">Content taxonomy</p>
      <h1 className="mt-3 text-4xl">Categories</h1>
      <form onSubmit={save} className="card mt-7 flex flex-wrap items-end gap-3">
        <label className="flex-1 text-sm">
          Name
          <input
            className="input mt-2"
            required
            minLength={2}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Status
          <select
            className="input mt-2"
            value={status}
            onChange={(e) => setStatus(e.target.value as Category['status'])}
          >
            {['Draft', 'Published', 'Archived'].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <button className="button-primary">{selected ? 'Update' : 'Add'} category</button>
      </form>
      {message && (
        <p role="status" className="mt-4 text-sm text-blue">
          {message}
        </p>
      )}
      {loading ? (
        <p className="mt-7">Loading…</p>
      ) : error ? (
        <p role="alert" className="mt-7 text-red-700">
          {error}
        </p>
      ) : (
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data?.map((c) => (
            <button
              className="card text-left"
              key={c.id}
              onClick={() => {
                setSelected(c);
                setName(c.name);
                setStatus(c.status);
              }}
            >
              <span className="font-semibold">{c.name}</span>
              <span className="ml-3 text-xs text-muted">{c.status}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
interface Playlist {
  id: string;
  resource_id: string;
  youtube_playlist_id: string;
  status: string;
  title: string;
  lesson_count: string;
}
interface Video {
  id: string;
  title: string;
  kind: string;
}
export function AdminPlaylists() {
  const { data, loading, error, refresh } = useAdminData<Playlist[]>('/playlists');
  const videos = useAdminData<Video[]>('/resources');
  const [selected, setSelected] = useState<Playlist | null>(null);
  const [ids, setIds] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  async function load(p: Playlist) {
    setSelected(p);
    const resource = await request<{ lessons: Video[] }>(`/admin/playlists/${p.id}/videos`);
    setIds(resource.lessons.map((x) => x.id));
  }
  async function save() {
    if (!selected) return;
    try {
      await request(`/admin/playlists/${selected.id}/videos`, {
        method: 'PUT',
        body: JSON.stringify({ resourceIds: ids }),
      });
      setMessage('Playlist lessons saved');
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to save playlist');
    }
  }
  return (
    <div>
      <p className="eyebrow">Video curation</p>
      <h1 className="mt-3 text-4xl">Playlists</h1>
      <p className="mt-3 text-sm text-muted">
        Create playlist resources in Resources, then order their curated video lessons here.
        Metadata is entered manually.
      </p>
      {message && (
        <p role="status" className="mt-4 text-sm text-blue">
          {message}
        </p>
      )}
      {loading ? (
        <p className="mt-7">Loading…</p>
      ) : error ? (
        <p role="alert" className="mt-7 text-red-700">
          {error}
        </p>
      ) : (
        <div className="mt-7 grid gap-3">
          {data?.map((p) => (
            <button key={p.id} className="card text-left" onClick={() => void load(p)}>
              <span className="font-semibold">{p.title}</span>
              <span className="ml-3 text-sm text-muted">
                {p.lesson_count} curated lessons · {p.status}
              </span>
            </button>
          ))}
        </div>
      )}
      {selected && (
        <section className="card mt-7">
          <h2 className="text-2xl">{selected.title}</h2>
          <label className="mt-5 block text-sm">
            Add video lesson
            <select
              className="input mt-2"
              value=""
              onChange={(e) => {
                if (e.target.value && !ids.includes(e.target.value))
                  setIds([...ids, e.target.value]);
              }}
            >
              <option value="">Choose a video</option>
              {videos.data
                ?.filter((v) => v.kind === 'Video' && !ids.includes(v.id))
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.title}
                  </option>
                ))}
            </select>
          </label>
          <ol className="mt-5 space-y-2">
            {ids.map((id, i) => (
              <li key={id} className="flex items-center gap-3 rounded-lg bg-paper p-3 text-sm">
                <span className="w-6 text-blue">{i + 1}.</span>
                <span className="flex-1">{videos.data?.find((v) => v.id === id)?.title || id}</span>
                <button
                  aria-label={`Move lesson ${i + 1} up`}
                  disabled={i === 0}
                  onClick={() =>
                    setIds((x) => {
                      const y = [...x];
                      [y[i - 1], y[i]] = [y[i], y[i - 1]];
                      return y;
                    })
                  }
                >
                  ↑
                </button>
                <button
                  aria-label={`Move lesson ${i + 1} down`}
                  disabled={i === ids.length - 1}
                  onClick={() =>
                    setIds((x) => {
                      const y = [...x];
                      [y[i + 1], y[i]] = [y[i], y[i + 1]];
                      return y;
                    })
                  }
                >
                  ↓
                </button>
                <button
                  className="text-red-700"
                  onClick={() => setIds((x) => x.filter((v) => v !== id))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ol>
          <button className="button-primary mt-5" onClick={() => void save()}>
            Save lesson order
          </button>
        </section>
      )}
    </div>
  );
}
export function AdminSettings() {
  const { data, loading, error } = useAdminData<{
    googleEnabled: boolean;
    emailEnabled: boolean;
    youtubeDataApiEnabled: boolean;
  }>('/settings');
  return (
    <div>
      <p className="eyebrow">Configuration</p>
      <h1 className="mt-3 text-4xl">Settings</h1>
      {loading ? (
        <p className="mt-7">Loading…</p>
      ) : error ? (
        <p role="alert" className="mt-7 text-red-700">
          {error}
        </p>
      ) : (
        <div className="card mt-7 space-y-4 text-sm">
          <p>Google sign-in: {data?.googleEnabled ? 'Configured' : 'Not configured'}</p>
          <p>Email delivery: {data?.emailEnabled ? 'Configured' : 'Not configured'}</p>
          <p>YouTube Data API: {data?.youtubeDataApiEnabled ? 'Configured' : 'Not configured'}</p>
          <p className="text-muted">
            Credentials are managed on the server through environment variables.
          </p>
          <Link to="/profile" className="button-outline">
            Your profile
          </Link>
        </div>
      )}
    </div>
  );
}
