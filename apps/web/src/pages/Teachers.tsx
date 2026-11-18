import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FilterSelect } from '../components/shared/FilterSelect';
import { Empty, ErrorState, Loading } from '../components/shared/States';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import type { Educator } from '../types';
const unique = (records: Educator[], key: 'focus' | 'subjects' | 'languages' | 'levels') =>
  [...new Set(records.flatMap((r) => (key === 'focus' ? [r.focus] : r[key])))].sort();
export function Teachers() {
  const [query, setQuery] = useState('');
  const [focus, setFocus] = useState('');
  const [subject, setSubject] = useState('');
  const [language, setLanguage] = useState('');
  const [level, setLevel] = useState('');
  const { data, error, loading } = useApi(() => api.educators(), []);
  const all = data || [];
  const filtered = all.filter(
    (e) =>
      (!query ||
        `${e.name} ${e.description} ${e.subjects.join(' ')}`
          .toLowerCase()
          .includes(query.toLowerCase())) &&
      (!focus || e.focus === focus) &&
      (!subject || e.subjects.includes(subject)) &&
      (!language || e.languages.includes(language)) &&
      (!level || e.levels.includes(level)),
  );
  const active = !!(query || focus || subject || language || level);
  return (
    <main className="container-site py-14">
      <p className="eyebrow">People and publishers behind the learning</p>
      <h1 className="mt-4 text-5xl sm:text-6xl">Educator directory</h1>
      <p className="mt-5 max-w-2xl text-muted">
        Browse learning publishers represented in the resource library. Profiles describe available
        content and do not imply endorsement or independent verification.
      </p>
      <div className="mt-9 rounded-2xl border border-border bg-white p-5">
        <label className="block text-xs font-semibold text-muted">
          Search educators
          <input
            className="input mt-2"
            placeholder="Search name or subject…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FilterSelect
            label="Exam or skill"
            value={focus}
            options={unique(all, 'focus')}
            onChange={setFocus}
          />
          <FilterSelect
            label="Subject"
            value={subject}
            options={unique(all, 'subjects')}
            onChange={setSubject}
          />
          <FilterSelect
            label="Language"
            value={language}
            options={unique(all, 'languages')}
            onChange={setLanguage}
          />
          <FilterSelect
            label="Learning level"
            value={level}
            options={unique(all, 'levels')}
            onChange={setLevel}
          />
        </div>
        {active && (
          <button
            className="mt-5 text-sm font-semibold text-blue underline"
            onClick={() => {
              setQuery('');
              setFocus('');
              setSubject('');
              setLanguage('');
              setLevel('');
            }}
          >
            Clear filters
          </button>
        )}
      </div>
      <div className="mt-8">
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} />
        ) : filtered.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((e) => (
              <Link className="card group block" key={e.id} to={`/teachers/${e.slug}`}>
                <p className="eyebrow">
                  {e.kind} / {e.focus}
                </p>
                <h2 className="mt-4 text-3xl group-hover:text-blue">{e.name}</h2>
                <p className="mt-3 text-sm leading-6 text-muted">{e.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {e.subjects.map((s) => (
                    <span key={s} className="rounded-full bg-paper px-3 py-1 text-xs text-muted">
                      {s}
                    </span>
                  ))}
                </div>
                <p className="mt-5 text-xs text-muted">
                  {e.languages.join(', ')} · {e.levels.join(', ')}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <Empty message="No educator records match these filters." />
        )}
      </div>
    </main>
  );
}
