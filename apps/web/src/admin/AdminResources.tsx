import { useState, type FormEvent } from 'react';
import { request } from '../services/api';
import { useAdminData } from './useAdminData';
type Resource = {
  id: string;
  title: string;
  slug: string;
  kind: 'Video' | 'Playlist';
  category: string;
  language: string;
  creator: string;
  url: string;
  topic: string;
  level: string;
  educator_slug: string | null;
  related_slug: string | null;
  review_status: 'Not reviewed' | 'Reviewed';
  description: string;
  thumbnail_url: string | null;
  status: 'Draft' | 'Published' | 'Archived';
};
const empty: Resource = {
  id: '',
  title: '',
  slug: '',
  kind: 'Video',
  category: 'General',
  language: 'English',
  creator: '',
  url: '',
  topic: 'General',
  level: 'Beginner',
  educator_slug: null,
  related_slug: null,
  review_status: 'Not reviewed',
  description: '',
  thumbnail_url: null,
  status: 'Draft',
};
export function AdminResources() {
  const { data, loading, error, refresh } = useAdminData<Resource[]>('/resources');
  const [form, setForm] = useState<Resource>(empty);
  const [message, setMessage] = useState('');
  const set = (key: keyof Resource, value: unknown) =>
    setForm((current) => ({ ...current, [key]: value }));
  async function save(e: FormEvent) {
    e.preventDefault();
    try {
      const saved = await request<Resource>(`/admin/resources${form.id ? `/${form.id}` : ''}`, {
        method: form.id ? 'PUT' : 'POST',
        body: JSON.stringify(form),
      });
      setForm(saved);
      setMessage('Resource saved');
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to save resource');
    }
  }
  async function archive() {
    if (!form.id || !confirm(`Archive ${form.title}?`)) return;
    try {
      await request(`/admin/resources/${form.id}`, { method: 'DELETE' });
      setForm(empty);
      setMessage('Resource archived');
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to archive resource');
    }
  }
  return (
    <div>
      <p className="eyebrow">Learning library</p>
      <h1 className="mt-3 text-4xl">Video resources</h1>
      <p className="mt-3 text-sm text-muted">
        Add supported YouTube links and manually curate metadata.
      </p>
      <div className="mt-7 grid gap-6 xl:grid-cols-[280px_1fr]">
        <aside className="card h-fit">
          <button className="button-outline w-full" onClick={() => setForm(empty)}>
            New resource
          </button>
          {loading ? (
            <p className="mt-5">Loading…</p>
          ) : error ? (
            <p role="alert" className="mt-5 text-red-700">
              {error}
            </p>
          ) : (
            <div className="mt-5 max-h-[65vh] space-y-1 overflow-y-auto">
              {data?.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setForm(r)}
                  className={`w-full rounded-lg p-3 text-left text-sm ${form.id === r.id ? 'bg-softblue' : 'hover:bg-paper'}`}
                >
                  <span className="block font-semibold">{r.title}</span>
                  <span className="text-xs text-muted">
                    {r.kind} · {r.status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </aside>
        <form onSubmit={save} className="card space-y-4">
          <h2 className="text-2xl">{form.id ? 'Edit resource' : 'Create resource'}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {(['title', 'slug', 'category', 'language', 'creator', 'topic', 'level'] as const).map(
              (key) => (
                <label key={key} className="text-sm capitalize">
                  {key}
                  <input
                    required
                    className="input mt-2"
                    value={form[key]}
                    onChange={(e) => set(key, e.target.value)}
                  />
                </label>
              ),
            )}
            <label className="text-sm">
              Type
              <select
                className="input mt-2"
                value={form.kind}
                onChange={(e) => set('kind', e.target.value)}
              >
                <option>Video</option>
                <option>Playlist</option>
              </select>
            </label>
          </div>
          <label className="block text-sm">
            YouTube URL
            <input
              className="input mt-2"
              type="url"
              required
              value={form.url}
              onChange={(e) => set('url', e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Description
            <textarea
              className="input mt-2 min-h-24"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              Educator slug
              <input
                className="input mt-2"
                value={form.educator_slug || ''}
                onChange={(e) => set('educator_slug', e.target.value || null)}
              />
            </label>
            <label className="text-sm">
              Related course slug
              <input
                className="input mt-2"
                value={form.related_slug || ''}
                onChange={(e) => set('related_slug', e.target.value || null)}
              />
            </label>
            <label className="text-sm">
              Review status
              <select
                className="input mt-2"
                value={form.review_status}
                onChange={(e) => set('review_status', e.target.value)}
              >
                <option>Not reviewed</option>
                <option>Reviewed</option>
              </select>
            </label>
            <label className="text-sm">
              Publishing status
              <select
                className="input mt-2"
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
              >
                <option>Draft</option>
                <option>Published</option>
                <option>Archived</option>
              </select>
            </label>
          </div>
          <label className="block text-sm">
            Thumbnail URL
            <input
              className="input mt-2"
              value={form.thumbnail_url || ''}
              onChange={(e) => set('thumbnail_url', e.target.value || null)}
            />
          </label>
          <label className="block text-sm">
            Or upload thumbnail
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="mt-2 block"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file)
                  try {
                    const body = new FormData();
                    body.append('image', file);
                    const result = await request<{ url: string }>('/admin/uploads', {
                      method: 'POST',
                      body,
                    });
                    set('thumbnail_url', result.url);
                  } catch (x) {
                    setMessage(x instanceof Error ? x.message : 'Upload failed');
                  }
              }}
            />
          </label>
          {message && (
            <p role="status" className="text-sm text-blue">
              {message}
            </p>
          )}
          <div className="flex gap-3">
            <button className="button-primary">Save resource</button>
            {form.id && (
              <button type="button" className="button-outline" onClick={() => void archive()}>
                Archive
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
