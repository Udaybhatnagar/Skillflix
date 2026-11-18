import { useState, type FormEvent } from 'react';
import { request } from '../services/api';
import { useAdminData } from './useAdminData';
type Status = 'Draft' | 'Published' | 'Archived';
const statuses: Status[] = ['Draft', 'Published', 'Archived'];
const split = (value: string) =>
  value
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);
const join = (value: string[] | undefined) => value?.join('\n') || '';
const media = (value: string | null | undefined) =>
  value?.startsWith('/api/') ? `${import.meta.env.VITE_API_URL || ''}${value}` : value || '';
async function upload(file: File) {
  const body = new FormData();
  body.append('image', file);
  const result = await request<{ url: string }>('/admin/uploads', { method: 'POST', body });
  return result.url;
}
interface Course {
  id: string;
  kind: 'exam' | 'skill';
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: string;
  estimated_duration: string | null;
  thumbnail_url: string | null;
  outcomes: string[];
  prerequisites: string[];
  modules: string[];
  guidance: string;
  status: Status;
}
const blankCourse: Course = {
  id: '',
  kind: 'skill',
  title: '',
  slug: '',
  description: '',
  category: '',
  difficulty: 'Beginner',
  estimated_duration: null,
  thumbnail_url: null,
  outcomes: [],
  prerequisites: [],
  modules: [],
  guidance: '',
  status: 'Draft',
};
export function AdminCourses({ kind }: { kind?: 'exam' | 'skill' }) {
  const { data, loading, error, refresh } = useAdminData<Course[]>('/courses');
  const teachers = useAdminData<Array<{ id: string; name: string }>>('/teachers');
  const resources = useAdminData<Array<{ id: string; title: string }>>('/resources');
  const [form, setForm] = useState<Course>({ ...blankCourse, kind: kind || 'skill' });
  const [outcomes, setOutcomes] = useState('');
  const [prerequisites, setPrerequisites] = useState('');
  const [modules, setModules] = useState('');
  const [teacherIds, setTeacherIds] = useState<string[]>([]);
  const [resourceIds, setResourceIds] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const set = (key: keyof Course, value: unknown) =>
    setForm((current) => ({ ...current, [key]: value }));
  const choose = async (c: Course) => {
    setForm(c);
    setOutcomes(join(c.outcomes));
    setPrerequisites(join(c.prerequisites));
    setModules(join(c.modules));
    if (c.id) {
      const linked = await request<{ teacherIds: string[]; resourceIds: string[] }>(
        `/admin/courses/${c.id}/associations`,
      );
      setTeacherIds(linked.teacherIds);
      setResourceIds(linked.resourceIds);
    }
  };
  const reset = () => {
    setForm({ ...blankCourse, kind: kind || 'skill' });
    setOutcomes('');
    setPrerequisites('');
    setModules('');
    setTeacherIds([]);
    setResourceIds([]);
  };
  async function save(e: FormEvent) {
    e.preventDefault();
    setMessage('');
    try {
      const payload = {
        ...form,
        outcomes: split(outcomes),
        prerequisites: split(prerequisites),
        modules: split(modules),
      };
      const saved = await request<Course>(`/admin/courses${form.id ? `/${form.id}` : ''}`, {
        method: form.id ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      if (teacherIds.length || form.id)
        await request(`/admin/courses/${saved.id}/teachers`, {
          method: 'PUT',
          body: JSON.stringify({ ids: teacherIds }),
        });
      if (resourceIds.length || form.id)
        await request(`/admin/courses/${saved.id}/resources`, {
          method: 'PUT',
          body: JSON.stringify({ ids: resourceIds }),
        });
      setMessage('Course saved');
      setForm(saved);
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to save course');
    }
  }
  async function archive() {
    if (!form.id || !confirm(`Archive ${form.title}? It will disappear from public pages.`)) return;
    try {
      await request(`/admin/courses/${form.id}`, { method: 'DELETE' });
      setMessage('Course archived');
      reset();
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to archive');
    }
  }
  const visible = data?.filter((c) => !kind || c.kind === kind) || [];
  return (
    <div>
      <p className="eyebrow">Content management</p>
      <h1 className="mt-3 text-4xl">
        {kind === 'exam' ? 'Exams' : kind === 'skill' ? 'Skills' : 'Courses'}
      </h1>
      <div className="mt-7 grid gap-6 xl:grid-cols-[280px_1fr]">
        <aside className="card h-fit">
          <button className="button-outline w-full" onClick={reset}>
            New {kind || 'course'}
          </button>
          {loading ? (
            <p className="mt-5">Loading…</p>
          ) : error ? (
            <p role="alert" className="mt-5 text-red-700">
              {error}
            </p>
          ) : (
            <div className="mt-5 max-h-[60vh] space-y-1 overflow-y-auto">
              {visible.map((c) => (
                <button
                  className={`w-full rounded-lg p-3 text-left text-sm ${form.id === c.id ? 'bg-softblue text-blue' : 'hover:bg-paper'}`}
                  key={c.id}
                  onClick={() => void choose(c)}
                >
                  <span className="block font-semibold">{c.title}</span>
                  <span className="text-xs text-muted">
                    {c.kind} · {c.status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </aside>
        <form onSubmit={save} className="card space-y-5">
          <h2 className="text-2xl">{form.id ? 'Edit course' : 'Create course'}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              Title
              <input
                className="input mt-2"
                required
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
              />
            </label>
            <label className="text-sm">
              Slug
              <input
                className="input mt-2"
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                value={form.slug}
                onChange={(e) => set('slug', e.target.value)}
              />
            </label>
            <label className="text-sm">
              Type
              <select
                className="input mt-2"
                value={form.kind}
                disabled={!!kind}
                onChange={(e) => set('kind', e.target.value)}
              >
                <option value="exam">Exam</option>
                <option value="skill">Professional skill</option>
              </select>
            </label>
            <label className="text-sm">
              Category
              <input
                className="input mt-2"
                required
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
              />
            </label>
            <label className="text-sm">
              Difficulty
              <input
                className="input mt-2"
                required
                value={form.difficulty}
                onChange={(e) => set('difficulty', e.target.value)}
              />
            </label>
            <label className="text-sm">
              Estimated duration
              <input
                className="input mt-2"
                value={form.estimated_duration || ''}
                onChange={(e) => set('estimated_duration', e.target.value || null)}
              />
            </label>
          </div>
          <label className="block text-sm">
            Description
            <textarea
              className="input mt-2 min-h-28"
              required
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Beginner guidance
            <textarea
              className="input mt-2 min-h-20"
              value={form.guidance}
              onChange={(e) => set('guidance', e.target.value)}
            />
          </label>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm">
              Learning outcomes, one per line
              <textarea
                className="input mt-2 min-h-28"
                value={outcomes}
                onChange={(e) => setOutcomes(e.target.value)}
              />
            </label>
            <label className="text-sm">
              Prerequisites, one per line
              <textarea
                className="input mt-2 min-h-28"
                value={prerequisites}
                onChange={(e) => setPrerequisites(e.target.value)}
              />
            </label>
            <label className="text-sm">
              Modules, one per line
              <textarea
                className="input mt-2 min-h-28"
                value={modules}
                onChange={(e) => setModules(e.target.value)}
              />
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
                    set('thumbnail_url', await upload(file));
                  } catch (x) {
                    setMessage(x instanceof Error ? x.message : 'Upload failed');
                  }
              }}
            />
          </label>
          {form.thumbnail_url && (
            <img
              src={media(form.thumbnail_url)}
              alt="Course thumbnail preview"
              className="h-28 rounded-lg object-cover"
            />
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              Assign teachers
              <select
                multiple
                className="input mt-2 h-36"
                value={teacherIds}
                onChange={(e) => setTeacherIds([...e.target.selectedOptions].map((x) => x.value))}
              >
                {teachers.data?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Associate resources
              <select
                multiple
                className="input mt-2 h-36"
                value={resourceIds}
                onChange={(e) => setResourceIds([...e.target.selectedOptions].map((x) => x.value))}
              >
                {resources.data?.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-sm">
            Publishing status
            <select
              className="input mt-2"
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
            >
              {statuses.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          {message && (
            <p role="status" className="text-sm text-blue">
              {message}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button className="button-primary">Save course</button>
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
interface Teacher {
  id: string;
  name: string;
  slug: string;
  kind: string;
  focus: string;
  description: string;
  biography: string | null;
  image_url: string | null;
  subjects: string[];
  languages: string[];
  levels: string[];
  path_slugs: string[];
  channel_url: string | null;
  status: Status;
}
const blankTeacher: Teacher = {
  id: '',
  name: '',
  slug: '',
  kind: 'Educator',
  focus: '',
  description: '',
  biography: '',
  image_url: null,
  subjects: [],
  languages: [],
  levels: [],
  path_slugs: [],
  channel_url: null,
  status: 'Draft',
};
export function AdminTeachers() {
  const { data, loading, error, refresh } = useAdminData<Teacher[]>('/teachers');
  const [form, setForm] = useState<Teacher>(blankTeacher);
  const [subjects, setSubjects] = useState('');
  const [languages, setLanguages] = useState('');
  const [levels, setLevels] = useState('');
  const [paths, setPaths] = useState('');
  const [message, setMessage] = useState('');
  const set = (key: keyof Teacher, value: unknown) =>
    setForm((current) => ({ ...current, [key]: value }));
  const choose = (t: Teacher) => {
    setForm(t);
    setSubjects(join(t.subjects));
    setLanguages(join(t.languages));
    setLevels(join(t.levels));
    setPaths(join(t.path_slugs));
  };
  const reset = () => {
    setForm(blankTeacher);
    setSubjects('');
    setLanguages('');
    setLevels('');
    setPaths('');
  };
  async function save(e: FormEvent) {
    e.preventDefault();
    try {
      const saved = await request<Teacher>(`/admin/teachers${form.id ? `/${form.id}` : ''}`, {
        method: form.id ? 'PUT' : 'POST',
        body: JSON.stringify({
          ...form,
          subjects: split(subjects),
          languages: split(languages),
          levels: split(levels),
          path_slugs: split(paths),
        }),
      });
      setForm(saved);
      setMessage('Teacher profile saved');
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to save profile');
    }
  }
  async function archive() {
    if (!form.id || !confirm(`Archive ${form.name}?`)) return;
    try {
      await request(`/admin/teachers/${form.id}`, { method: 'DELETE' });
      reset();
      setMessage('Profile archived');
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to archive profile');
    }
  }
  return (
    <div>
      <p className="eyebrow">People</p>
      <h1 className="mt-3 text-4xl">Teachers and publishers</h1>
      <div className="mt-7 grid gap-6 xl:grid-cols-[280px_1fr]">
        <aside className="card h-fit">
          <button className="button-outline w-full" onClick={reset}>
            New profile
          </button>
          {loading ? (
            <p className="mt-5">Loading…</p>
          ) : error ? (
            <p role="alert" className="mt-5 text-red-700">
              {error}
            </p>
          ) : (
            <div className="mt-5 space-y-1">
              {data?.map((t) => (
                <button
                  key={t.id}
                  className={`w-full rounded-lg p-3 text-left text-sm ${form.id === t.id ? 'bg-softblue' : 'hover:bg-paper'}`}
                  onClick={() => choose(t)}
                >
                  {t.name}
                  <span className="ml-2 text-xs text-muted">{t.status}</span>
                </button>
              ))}
            </div>
          )}
        </aside>
        <form className="card space-y-4" onSubmit={save}>
          <h2 className="text-2xl">{form.id ? 'Edit profile' : 'Create profile'}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              Name
              <input
                className="input mt-2"
                required
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
              />
            </label>
            <label className="text-sm">
              Slug
              <input
                className="input mt-2"
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                value={form.slug}
                onChange={(e) => set('slug', e.target.value)}
              />
            </label>
            <label className="text-sm">
              Profile type
              <select
                className="input mt-2"
                value={form.kind}
                onChange={(e) => set('kind', e.target.value)}
              >
                <option>Educator</option>
                <option>Publisher</option>
              </select>
            </label>
            <label className="text-sm">
              Focus
              <input
                className="input mt-2"
                value={form.focus}
                onChange={(e) => set('focus', e.target.value)}
              />
            </label>
          </div>
          <label className="block text-sm">
            Overview
            <textarea
              className="input mt-2 min-h-20"
              required
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Biography
            <textarea
              className="input mt-2 min-h-28"
              value={form.biography || ''}
              onChange={(e) => set('biography', e.target.value)}
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              Subjects, one per line
              <textarea
                className="input mt-2 min-h-24"
                value={subjects}
                onChange={(e) => setSubjects(e.target.value)}
              />
            </label>
            <label className="text-sm">
              Skills or related course slugs, one per line
              <textarea
                className="input mt-2 min-h-24"
                value={paths}
                onChange={(e) => setPaths(e.target.value)}
              />
            </label>
            <label className="text-sm">
              Languages, one per line
              <textarea
                className="input mt-2 min-h-24"
                value={languages}
                onChange={(e) => setLanguages(e.target.value)}
              />
            </label>
            <label className="text-sm">
              Learning levels, one per line
              <textarea
                className="input mt-2 min-h-24"
                value={levels}
                onChange={(e) => setLevels(e.target.value)}
              />
            </label>
          </div>
          <label className="block text-sm">
            YouTube channel URL
            <input
              className="input mt-2"
              type="url"
              value={form.channel_url || ''}
              onChange={(e) => set('channel_url', e.target.value || null)}
            />
          </label>
          <label className="block text-sm">
            Profile image URL
            <input
              className="input mt-2"
              value={form.image_url || ''}
              onChange={(e) => set('image_url', e.target.value || null)}
            />
          </label>
          <label className="block text-sm">
            Or upload image
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="mt-2 block"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file)
                  try {
                    set('image_url', await upload(file));
                  } catch (x) {
                    setMessage(x instanceof Error ? x.message : 'Upload failed');
                  }
              }}
            />
          </label>
          {form.image_url && (
            <img
              src={media(form.image_url)}
              alt="Profile preview"
              className="h-24 w-24 rounded-full object-cover"
            />
          )}
          <label className="block text-sm">
            Status
            <select
              className="input mt-2"
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
            >
              {statuses.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          {message && (
            <p role="status" className="text-sm text-blue">
              {message}
            </p>
          )}
          <div className="flex gap-3">
            <button className="button-primary">Save profile</button>
            {form.id && (
              <button className="button-outline" type="button" onClick={() => void archive()}>
                Archive
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
