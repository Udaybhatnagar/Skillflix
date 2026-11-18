import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { request } from '../services/api';
import { useAdminData } from './useAdminData';
type Topic = {
  id: string;
  title: string;
  description: string;
  hours: number;
  prerequisites: string[];
  resourceIds: string[];
};
type Stage = { id: string; title: string; description: string; topics: Topic[] };
type Roadmap = {
  id: string;
  course_id: string;
  title: string;
  overview: string;
  status: 'Draft' | 'Published' | 'Archived';
  stages: Stage[];
  kind?: 'exam' | 'skill';
  slug?: string;
};
type Course = { id: string; title: string; kind: string; slug: string };
type Resource = { id: string; title: string; kind: string };
const blank: Roadmap = {
  id: '',
  course_id: '',
  title: '',
  overview: '',
  status: 'Draft',
  stages: [],
};
const newId = () => crypto.randomUUID();
function move<T>(list: T[], index: number, direction: number) {
  const next = [...list],
    other = index + direction;
  if (other < 0 || other >= next.length) return list;
  [next[index], next[other]] = [next[other], next[index]];
  return next;
}
export function AdminRoadmaps() {
  const { data, loading, error, refresh } = useAdminData<Roadmap[]>('/roadmaps');
  const courses = useAdminData<Course[]>('/courses');
  const resources = useAdminData<Resource[]>('/resources');
  const [form, setForm] = useState<Roadmap>(blank);
  const [message, setMessage] = useState('');
  const update = (patch: Partial<Roadmap>) => setForm((f) => ({ ...f, ...patch }));
  const stages = (change: (list: Stage[]) => Stage[]) =>
    setForm((f) => ({ ...f, stages: change(f.stages) }));
  const stage = (index: number, patch: Partial<Stage>) =>
    stages((list) => list.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  const topic = (si: number, ti: number, patch: Partial<Topic>) =>
    stages((list) =>
      list.map((s, i) =>
        i === si
          ? { ...s, topics: s.topics.map((t, j) => (j === ti ? { ...t, ...patch } : t)) }
          : s,
      ),
    );
  async function choose(row: Roadmap) {
    try {
      const detail = await request<Roadmap>(`/admin/roadmaps/${row.id}`);
      setForm(detail);
      setMessage('');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to load roadmap');
    }
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    try {
      if (!form.course_id) throw new Error('Choose a course');
      const header = {
        courseId: form.course_id,
        title: form.title,
        overview: form.overview,
        status: 'Draft',
      };
      const result = await request<Roadmap>(`/admin/roadmaps${form.id ? `/${form.id}` : ''}`, {
        method: form.id ? 'PUT' : 'POST',
        body: JSON.stringify(header),
      });
      await request(`/admin/roadmaps/${result.id}/structure`, {
        method: 'PUT',
        body: JSON.stringify({ stages: form.stages }),
      });
      if (form.status !== 'Draft')
        await request(`/admin/roadmaps/${result.id}`, {
          method: 'PUT',
          body: JSON.stringify({ ...header, status: form.status }),
        });
      setForm((f) => ({ ...f, id: result.id }));
      setMessage('Roadmap saved');
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to save roadmap');
    }
  }
  async function archive() {
    if (!form.id || !confirm(`Archive ${form.title}?`)) return;
    try {
      await request(`/admin/roadmaps/${form.id}`, { method: 'DELETE' });
      update({ status: 'Archived' });
      setMessage('Roadmap archived');
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to archive roadmap');
    }
  }
  const selectedCourse = courses.data?.find((c) => c.id === form.course_id);
  return (
    <div>
      <p className="eyebrow">Content management</p>
      <h1 className="mt-3 text-4xl">Roadmap builder</h1>
      <p className="mt-3 text-sm text-muted">
        Build ordered stages and topics. Use Move up and Move down for keyboard accessible
        reordering.
      </p>
      <div className="mt-7 grid gap-6 xl:grid-cols-[280px_1fr]">
        <aside className="card h-fit">
          <button
            className="button-outline w-full"
            onClick={() => {
              setForm(blank);
              setMessage('');
            }}
          >
            New roadmap
          </button>
          {loading ? (
            <p className="mt-5">Loading…</p>
          ) : error ? (
            <p role="alert" className="mt-5 text-red-700">
              {error}
            </p>
          ) : (
            <div className="mt-5 space-y-1">
              {data?.map((r) => (
                <button
                  key={r.id}
                  onClick={() => void choose(r)}
                  className={`w-full rounded-lg p-3 text-left text-sm ${form.id === r.id ? 'bg-softblue' : 'hover:bg-paper'}`}
                >
                  <span className="block font-semibold">{r.title}</span>
                  <span className="text-xs text-muted">{r.status}</span>
                </button>
              ))}
            </div>
          )}
        </aside>
        <form className="space-y-6" onSubmit={save}>
          <div className="card space-y-4">
            <h2 className="text-2xl">{form.id ? 'Edit roadmap' : 'Create roadmap'}</h2>
            <label className="block text-sm">
              Course
              <select
                className="input mt-2"
                required
                value={form.course_id}
                onChange={(e) => update({ course_id: e.target.value })}
              >
                <option value="">Select course</option>
                {courses.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Title
              <input
                className="input mt-2"
                required
                minLength={2}
                value={form.title}
                onChange={(e) => update({ title: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              Overview
              <textarea
                className="input mt-2 min-h-24"
                required
                minLength={10}
                value={form.overview}
                onChange={(e) => update({ overview: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              Status
              <select
                className="input mt-2"
                value={form.status}
                onChange={(e) => update({ status: e.target.value as Roadmap['status'] })}
              >
                <option>Draft</option>
                <option>Published</option>
                <option>Archived</option>
              </select>
            </label>
            {form.id && form.status === 'Published' && selectedCourse && (
              <Link
                className="text-sm text-blue underline"
                to={`/roadmap/${selectedCourse.kind}/${selectedCourse.slug}`}
                target="_blank"
              >
                Preview published roadmap
              </Link>
            )}
          </div>
          <details className="card">
            <summary className="cursor-pointer font-semibold text-blue">
              Preview roadmap structure
            </summary>
            <div className="mt-5">
              <h2 className="text-2xl">{form.title || 'Untitled roadmap'}</h2>
              <p className="mt-2 text-sm text-muted">{form.overview}</p>
              {form.stages.map((s, i) => (
                <div key={s.id} className="mt-5 border-t border-border pt-4">
                  <h3 className="text-xl">
                    {i + 1}. {s.title || 'Untitled stage'}
                  </h3>
                  <p className="text-sm text-muted">{s.description}</p>
                  <ol className="mt-3 list-inside list-decimal space-y-1 text-sm">
                    {s.topics.map((t) => (
                      <li key={t.id}>
                        {t.title || 'Untitled topic'} · {t.hours} hours · {t.resourceIds.length}{' '}
                        resources
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </details>
          {form.stages.map((s, si) => (
            <section className="card space-y-4" key={s.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xl">Stage {si + 1}</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="button-outline"
                    disabled={si === 0}
                    onClick={() => stages((list) => move(list, si, -1))}
                  >
                    Move up
                  </button>
                  <button
                    type="button"
                    className="button-outline"
                    disabled={si === form.stages.length - 1}
                    onClick={() => stages((list) => move(list, si, 1))}
                  >
                    Move down
                  </button>
                  <button
                    type="button"
                    className="button-outline"
                    onClick={() => stages((list) => list.filter((x) => x.id !== s.id))}
                  >
                    Remove
                  </button>
                </div>
              </div>
              <label className="block text-sm">
                Stage title
                <input
                  className="input mt-2"
                  required
                  value={s.title}
                  onChange={(e) => stage(si, { title: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                Description
                <textarea
                  className="input mt-2"
                  value={s.description}
                  onChange={(e) => stage(si, { description: e.target.value })}
                />
              </label>
              {s.topics.map((t, ti) => (
                <div className="rounded-xl border border-border bg-paper p-4" key={t.id}>
                  <div className="mb-3 flex flex-wrap justify-between gap-2">
                    <h4 className="font-semibold">Topic {ti + 1}</h4>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        aria-label={`Move ${t.title || 'topic'} up`}
                        disabled={ti === 0}
                        onClick={() => stage(si, { topics: move(s.topics, ti, -1) })}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label={`Move ${t.title || 'topic'} down`}
                        disabled={ti === s.topics.length - 1}
                        onClick={() => stage(si, { topics: move(s.topics, ti, 1) })}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => stage(si, { topics: s.topics.filter((x) => x.id !== t.id) })}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-sm">
                      Title
                      <input
                        className="input mt-2"
                        required
                        value={t.title}
                        onChange={(e) => topic(si, ti, { title: e.target.value })}
                      />
                    </label>
                    <label className="text-sm">
                      Study hours
                      <input
                        className="input mt-2"
                        type="number"
                        min="0"
                        max="999"
                        step="0.5"
                        value={t.hours}
                        onChange={(e) => topic(si, ti, { hours: Number(e.target.value) })}
                      />
                    </label>
                  </div>
                  <label className="mt-3 block text-sm">
                    Description
                    <textarea
                      className="input mt-2"
                      value={t.description}
                      onChange={(e) => topic(si, ti, { description: e.target.value })}
                    />
                  </label>
                  <label className="mt-3 block text-sm">
                    Prerequisites, one per line
                    <textarea
                      className="input mt-2"
                      value={t.prerequisites.join('\n')}
                      onChange={(e) =>
                        topic(si, ti, {
                          prerequisites: e.target.value
                            .split('\n')
                            .map((x) => x.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </label>
                  <label className="mt-3 block text-sm">
                    Recommended videos and playlists
                    <select
                      multiple
                      className="input mt-2 h-32"
                      value={t.resourceIds}
                      onChange={(e) =>
                        topic(si, ti, {
                          resourceIds: [...e.target.selectedOptions].map((x) => x.value),
                        })
                      }
                    >
                      {resources.data?.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.title} ({r.kind})
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ))}
              <button
                type="button"
                className="button-outline"
                onClick={() =>
                  stage(si, {
                    topics: [
                      ...s.topics,
                      {
                        id: newId(),
                        title: '',
                        description: '',
                        hours: 1,
                        prerequisites: [],
                        resourceIds: [],
                      },
                    ],
                  })
                }
              >
                Add topic
              </button>
            </section>
          ))}
          <button
            type="button"
            className="button-outline"
            onClick={() =>
              stages((list) => [...list, { id: newId(), title: '', description: '', topics: [] }])
            }
          >
            Add stage
          </button>
          {message && (
            <p role="status" className="text-sm text-blue">
              {message}
            </p>
          )}
          <div className="flex gap-3">
            <button className="button-primary">Save roadmap</button>
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
