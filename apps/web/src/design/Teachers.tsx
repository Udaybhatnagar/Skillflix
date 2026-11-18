import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import { Loading, ErrorState, NotFound } from '../components/shared/States';
import {
  Intro,
  Art,
  Breadcrumb,
  PlaylistCard,
  PathCard,
  SectionHead,
  ArrowUpRight,
} from './Common';
export function Teachers() {
  const data = useApi(() => api.educators(), []);
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState('');
  const list =
    data.data?.filter(
      (e) =>
        (!query ||
          `${e.name} ${e.focus} ${e.subjects.join(' ')}`
            .toLowerCase()
            .includes(query.toLowerCase())) &&
        (!language || e.languages.includes(language)),
    ) || [];
  return (
    <div className="container">
      <Intro
        eyebrow="PEOPLE BEHIND THE LEARNING"
        title="Good teachers make a difference."
        description="Discover educators and publishers whose resources help you take the next step."
      />
      <div className="filter-bar">
        <label className="flex-1">
          <span className="sr-only">Search teachers</span>
          <input
            className="input"
            placeholder="Search teachers or subjects"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          <span className="sr-only">Teaching language</span>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="">All languages</option>
            {[...new Set(data.data?.flatMap((e) => e.languages))].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
        <span className="result-count">{list.length} educators</span>
      </div>
      {data.loading ? (
        <Loading />
      ) : data.error ? (
        <ErrorState message={data.error} />
      ) : (
        <div className="course-grid">
          {list.map((e) => (
            <Link className="course-card" key={e.id} to={`/teachers/${e.slug}`}>
              <Art title={e.name} category={e.focus} />
              <div className="course-copy">
                <span className="eyebrow muted">
                  {e.kind} / {e.focus}
                </span>
                <h3>{e.name}</h3>
                <p>{e.description}</p>
                <div className="card-meta">
                  <span>{e.languages.join(', ')}</span>
                </div>
                <div className="card-bottom">
                  View educator <ArrowUpRight className="icon" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
export function TeacherProfile() {
  const { slug = '' } = useParams();
  const person = useApi(() => api.educator(slug), [slug]);
  const resources = useApi(() => api.resources(), []);
  const paths = useApi(async () => {
    const [a, b] = await Promise.all([api.catalog('skill'), api.catalog('exam')]);
    return [...a, ...b];
  }, []);
  if (person.loading) return <Loading />;
  if (person.error) return <ErrorState message={person.error} />;
  const e = person.data;
  if (!e) return <NotFound />;
  return (
    <div className="container">
      <Breadcrumb items={[{ label: 'Teachers', to: '/teachers' }, { label: e.name }]} />
      <section className="path-detail-hero">
        <div>
          <span className="eyebrow">
            {e.kind} / {e.focus}
          </span>
          <h1>{e.name}</h1>
          <p>{e.description}</p>
          <div className="path-facts">
            <span>{e.languages.join(', ')}</span>
            <span>{e.levels.join(', ')}</span>
          </div>
          {e.channel_url && (
            <a
              className="btn secondary"
              href={e.channel_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Original YouTube channel
              <ArrowUpRight className="icon" />
            </a>
          )}
        </div>
        <Art title={e.name} category={e.focus} large />
      </section>
      <section className="section">
        <SectionHead eyebrow="CURATED RESOURCES" title="Learn from this publisher." />
        {resources.loading ? (
          <Loading />
        ) : resources.error ? (
          <ErrorState message={resources.error} />
        ) : (
          <div className="playlist-grid">
            {resources.data
              ?.filter((r) => r.educator_slug === slug)
              .map((r) => (
                <PlaylistCard key={r.id} resource={r} />
              ))}
          </div>
        )}
      </section>
      <section className="section">
        <SectionHead eyebrow="FIND YOUR DIRECTION" title="Related learning paths." />
        {paths.loading ? (
          <Loading />
        ) : paths.error ? (
          <ErrorState message={paths.error} />
        ) : (
          <div className="course-grid">
            {paths.data
              ?.filter((c) => e.path_slugs.includes(c.slug))
              .map((c) => (
                <PathCard key={c.id} item={c} />
              ))}
          </div>
        )}
      </section>
    </div>
  );
}
