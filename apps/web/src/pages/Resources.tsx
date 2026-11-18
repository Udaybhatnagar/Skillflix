import { useState } from 'react';
import { ResourceCard } from '../components/shared/Cards';
import { FilterSelect } from '../components/shared/FilterSelect';
import { Empty, ErrorState, Loading } from '../components/shared/States';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import type { Resource } from '../types';
const unique = (resources: Resource[], key: keyof Resource) =>
  [
    ...new Set(
      resources.map((r) => r[key]).filter((x): x is string => typeof x === 'string' && !!x),
    ),
  ].sort();
export function Resources() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [topic, setTopic] = useState('');
  const [teacher, setTeacher] = useState('');
  const [language, setLanguage] = useState('');
  const [level, setLevel] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const { data, error, loading } = useApi(() => api.resources(), []);
  const all = data || [];
  const filtered = all.filter(
    (r) =>
      (!query ||
        `${r.title} ${r.creator} ${r.topic}`.toLowerCase().includes(query.toLowerCase())) &&
      (!category || r.category === category) &&
      (!topic || r.topic === topic) &&
      (!teacher || r.creator === teacher) &&
      (!language || r.language === language) &&
      (!level || r.level === level) &&
      (!type || r.kind === type) &&
      (!status || r.review_status === status),
  );
  const active = !!(query || category || topic || teacher || language || level || type || status);
  const clear = () => {
    setQuery('');
    setCategory('');
    setTopic('');
    setTeacher('');
    setLanguage('');
    setLevel('');
    setType('');
    setStatus('');
  };
  return (
    <main className="container-site py-14">
      <p className="eyebrow">The library</p>
      <h1 className="mt-4 text-5xl sm:text-6xl">Useful resources, clearly labelled.</h1>
      <p className="mt-5 max-w-2xl text-muted">
        Browse videos and playlists from named publishers. “Not reviewed” means Skillflix has not
        independently assessed the resource.
      </p>
      <div className="mt-9 rounded-2xl border border-border bg-white p-5">
        <label className="block text-xs font-semibold text-muted">
          Search resources
          <input
            className="input mt-2"
            placeholder="Search by title, creator or topic…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FilterSelect
            label="Category"
            value={category}
            options={unique(all, 'category')}
            onChange={setCategory}
          />
          <FilterSelect
            label="Topic"
            value={topic}
            options={unique(all, 'topic')}
            onChange={setTopic}
          />
          <FilterSelect
            label="Teacher / publisher"
            value={teacher}
            options={unique(all, 'creator')}
            onChange={setTeacher}
          />
          <FilterSelect
            label="Language"
            value={language}
            options={unique(all, 'language')}
            onChange={setLanguage}
          />
          <FilterSelect
            label="Level"
            value={level}
            options={unique(all, 'level')}
            onChange={setLevel}
          />
          <FilterSelect
            label="Resource type"
            value={type}
            options={unique(all, 'kind')}
            onChange={setType}
          />
          <FilterSelect
            label="Review status"
            value={status}
            options={unique(all, 'review_status')}
            onChange={setStatus}
          />
        </div>
        {active && (
          <button className="mt-5 text-sm font-semibold text-blue underline" onClick={clear}>
            Clear filters
          </button>
        )}
      </div>
      <div className="mt-8">
        <p className="mb-5 text-sm text-muted">
          {filtered.length} {filtered.length === 1 ? 'resource' : 'resources'}
        </p>
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} />
        ) : filtered.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        ) : (
          <Empty message="No resources match. Try another search or clear your filters." />
        )}
      </div>
    </main>
  );
}
