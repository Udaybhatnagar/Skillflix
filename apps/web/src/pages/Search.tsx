import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CatalogCard, ResourceCard } from '../components/shared/Cards';
import { Empty, ErrorState, Loading } from '../components/shared/States';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
export function Search() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q')?.trim() || '';
  const category = params.get('category') || '';
  const language = params.get('language') || '';
  const sort = params.get('sort') || 'title';
  const [draft, setDraft] = useState(q);
  useEffect(() => setDraft(q), [q]);
  const { data, error, loading } = useApi(
    () =>
      q
        ? api.search(q, category, language, sort)
        : Promise.resolve({ catalog: [], resources: [], educators: [], topics: [] }),
    [q, category, language, sort],
  );
  function submit(e: FormEvent) {
    e.preventDefault();
    setParams(draft.trim() ? { q: draft.trim(), category, language, sort } : {});
  }
  return (
    <main className="container-site py-14">
      <p className="eyebrow">Find your next step</p>
      <h1 className="mt-4 text-5xl sm:text-6xl">Search Skillflix</h1>
      <form onSubmit={submit} className="mt-8 flex max-w-2xl gap-3">
        <input
          className="input"
          aria-label="Search all content"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Search exams, skills, resources…"
        />
        <button className="button-primary">Search</button>
      </form>
      <div className="mt-4 grid max-w-2xl gap-3 sm:grid-cols-3">
        <label className="text-xs font-semibold text-muted">
          Category
          <input
            className="input mt-1"
            placeholder="All categories"
            value={category}
            onChange={(e) => setParams({ q, category: e.target.value, language, sort })}
          />
        </label>
        <label className="text-xs font-semibold text-muted">
          Language
          <input
            className="input mt-1"
            placeholder="All languages"
            value={language}
            onChange={(e) => setParams({ q, category, language: e.target.value, sort })}
          />
        </label>
        <label className="text-xs font-semibold text-muted">
          Sort
          <select
            className="input mt-1"
            value={sort}
            onChange={(e) => setParams({ q, category, language, sort: e.target.value })}
          >
            <option value="title">Title</option>
            <option value="recent">Recently added</option>
          </select>
        </label>
      </div>
      {!q ? (
        <div className="mt-10">
          <Empty message="Enter a term to search the catalog." />
        </div>
      ) : loading ? (
        <Loading />
      ) : error ? (
        <div className="mt-10">
          <ErrorState message={error} />
        </div>
      ) : (
        <div className="mt-12 space-y-12">
          <p className="text-sm text-muted">
            {(data?.catalog.length || 0) +
              (data?.resources.length || 0) +
              (data?.educators?.length || 0) +
              (data?.topics?.length || 0)}{' '}
            results
          </p>
          <section>
            <h2 className="section-title">
              Learning paths{' '}
              <span className="font-sans text-base text-muted">({data?.catalog.length || 0})</span>
            </h2>
            <div className="mt-6">
              {data?.catalog.length ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {data.catalog.map((x) => (
                    <CatalogCard key={x.id} item={x} />
                  ))}
                </div>
              ) : (
                <Empty message="No matching exams or skills." />
              )}
            </div>
          </section>
          <section>
            <h2 className="section-title">
              Teachers and publishers{' '}
              <span className="font-sans text-base text-muted">
                ({data?.educators?.length || 0})
              </span>
            </h2>
            {data?.educators?.length ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.educators.map((e) => (
                  <Link key={e.id} className="card block" to={`/teachers/${e.slug}`}>
                    <h3 className="text-2xl">{e.name}</h3>
                    <p className="mt-2 text-sm text-muted">{e.focus}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-5">
                <Empty message="No matching teachers." />
              </div>
            )}
          </section>
          <section>
            <h2 className="section-title">
              Roadmap topics{' '}
              <span className="font-sans text-base text-muted">({data?.topics?.length || 0})</span>
            </h2>
            {data?.topics?.length ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.topics.map((t) => (
                  <Link key={t.id} className="card block" to={`/roadmap/${t.type}/${t.slug}`}>
                    <h3 className="text-2xl">{t.title}</h3>
                    <p className="mt-2 text-sm text-muted">{t.description}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-5">
                <Empty message="No matching roadmap topics." />
              </div>
            )}
          </section>
          <section>
            <h2 className="section-title">
              Resources{' '}
              <span className="font-sans text-base text-muted">
                ({data?.resources.length || 0})
              </span>
            </h2>
            <div className="mt-6">
              {data?.resources.length ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {data.resources.map((x) => (
                    <ResourceCard key={x.id} resource={x} />
                  ))}
                </div>
              ) : (
                <Empty message="No matching resources." />
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
