import { useState } from 'react';
import { CatalogCard } from '../components/shared/Cards';
import { Empty, ErrorState, Loading } from '../components/shared/States';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
export function Catalog({ kind }: { kind: 'exam' | 'skill' }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const isExam = kind === 'exam';
  const categories = isExam
    ? ['Banking', 'SSC', 'Railway', 'Others']
    : ['Design', 'Technology', 'Business', 'Creative'];
  const { data, error, loading } = useApi(
    () => api.catalog(kind, query, category),
    [kind, query, category],
  );
  return (
    <main className="container-site py-14">
      <p className="eyebrow">Explore / {isExam ? 'Competitive exams' : 'Professional skills'}</p>
      <h1 className="mt-4 text-5xl sm:text-6xl">
        {isExam ? 'Prepare with purpose.' : 'Build what comes next.'}
      </h1>
      <p className="mt-5 max-w-2xl text-muted">
        {isExam
          ? 'Browse starting points for competitive exam preparation. Confirm current rules and dates with official exam bodies.'
          : 'Explore practical learning paths across design, technology, business and creative work.'}
      </p>
      <div className="mt-10 flex flex-col gap-4 border-y border-border py-5 md:flex-row md:items-center">
        <input
          className="input md:max-w-xs"
          aria-label={`Search ${isExam ? 'exams' : 'skills'}`}
          placeholder={`Search ${isExam ? 'exams' : 'skills'}…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex flex-wrap gap-2" aria-label="Category filters">
          <button
            className={`rounded-full px-4 py-2 text-sm ${category === '' ? 'bg-blue text-white' : 'border border-border bg-white'}`}
            onClick={() => setCategory('')}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              className={`rounded-full px-4 py-2 text-sm ${category === c ? 'bg-blue text-white' : 'border border-border bg-white'}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        {(query || category) && (
          <button
            className="text-sm text-blue underline"
            onClick={() => {
              setQuery('');
              setCategory('');
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
        ) : data?.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.map((item) => (
              <CatalogCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <Empty message="No matches. Try another search or clear your filters." />
        )}
      </div>
    </main>
  );
}
