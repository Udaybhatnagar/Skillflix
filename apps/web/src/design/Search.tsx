import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import { Loading, ErrorState } from '../components/shared/States';
import {
  PathCard,
  PlaylistCard,
  EmptyState,
  SearchForm,
  SectionHead,
  ArrowUpRight,
} from './Common';
export function ReferenceSearch() {
  const [params] = useSearchParams();
  const query = params.get('q') || '';
  const [tab, setTab] = useState('All Results');
  const [level, setLevel] = useState('');
  const [language, setLanguage] = useState('');
  const [sort, setSort] = useState('title');
  const data = useApi(
    () =>
      query
        ? api.search(query, '', language, sort)
        : Promise.resolve({ catalog: [], resources: [], educators: [], topics: [] }),
    [query, language, sort],
  );
  const paths = data.data?.catalog.filter((c) => !level || c.level === level) || [];
  const videos =
    data.data?.resources.filter((r) => r.kind === 'Video' && (!level || r.level === level)) || [];
  const playlists =
    data.data?.resources.filter((r) => r.kind === 'Playlist' && (!level || r.level === level)) ||
    [];
  const creators = data.data?.educators || [];
  const counts: Record<string, number> = {
    'All Results': paths.length + videos.length + playlists.length + creators.length,
    'Learning Paths': paths.length,
    Playlists: playlists.length,
    Videos: videos.length,
    Creators: creators.length,
  };
  const show = (name: string) => tab === 'All Results' || tab === name;
  return (
    <div className="concept-search-page">
      <aside className="concept-filters">
        <div className="flex items-center justify-between">
          <h3>Filters</h3>
          <button
            className="text-link"
            onClick={() => {
              setLevel('');
              setLanguage('');
              setTab('All Results');
            }}
          >
            Clear All
          </button>
        </div>
        <fieldset>
          <legend>Content Type</legend>
          {Object.keys(counts).map((t) => (
            <label key={t}>
              <input
                type="radio"
                name="content-type"
                checked={tab === t}
                onChange={() => setTab(t)}
              />
              {t}
              <span className="ml-auto">{counts[t]}</span>
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>Level</legend>
          {['Beginner', 'Intermediate', 'Advanced'].map((l) => (
            <label key={l}>
              <input
                type="radio"
                name="search-level"
                checked={level === l}
                onChange={() => setLevel(l)}
              />
              {l}
            </label>
          ))}
        </fieldset>
        <label className="filter-select">
          Language
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="">All languages</option>
            <option>English</option>
            <option>Hindi</option>
            <option>Hinglish</option>
          </select>
        </label>
        <p className="concept-filter-note">Results reflect the published Skillflix catalog.</p>
      </aside>
      <div className="concept-search-main">
        <h1>
          Search Results{' '}
          {query && (
            <>
              for “<span>{query}</span>”
            </>
          )}
        </h1>
        <SearchForm key={query} initial={query} />
        <div className="concept-search-toolbar">
          <div className="tabs" role="tablist">
            {Object.keys(counts).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                className={tab === t ? 'active' : ''}
                onClick={() => setTab(t)}
              >
                {t} <small>({counts[t]})</small>
              </button>
            ))}
          </div>
          <select aria-label="Sort results" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="title">Sort: Title</option>
            <option value="recent">Sort: Recent</option>
          </select>
        </div>
        {data.loading ? (
          <Loading />
        ) : data.error ? (
          <ErrorState message={data.error} />
        ) : !counts[tab] ? (
          <EmptyState
            title="No results match your search."
            description="Try another topic or reset your filters."
          />
        ) : (
          <>
            {show('Learning Paths') && paths.length > 0 && (
              <section className="concept-section">
                <SectionHead eyebrow="" title="Learning Paths" />
                <div className="concept-search-paths">
                  {paths.map((c) => (
                    <PathCard key={c.id} item={c} />
                  ))}
                </div>
              </section>
            )}
            <div className={tab === 'All Results' && creators.length ? 'concept-search-split' : ''}>
              <div>
                {show('Playlists') && playlists.length > 0 && (
                  <section className="concept-section">
                    <SectionHead eyebrow="" title="Playlists" />
                    <div className="concept-resource-grid">
                      {playlists.map((r) => (
                        <PlaylistCard key={r.id} resource={r} />
                      ))}
                    </div>
                  </section>
                )}
                {show('Videos') && videos.length > 0 && (
                  <section className="concept-section">
                    <SectionHead eyebrow="" title="Videos" />
                    <div className="concept-playlist-list">
                      {videos.map((r) => (
                        <PlaylistCard key={r.id} resource={r} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
              {show('Creators') && creators.length > 0 && (
                <section className="concept-creators-panel">
                  <h2>Creators</h2>
                  {creators.map((c) => (
                    <Link key={c.id} to={`/teachers/${c.slug}`}>
                      <span className="avatar">{c.name[0]}</span>
                      <div>
                        <h3>{c.name}</h3>
                        <p>{c.focus}</p>
                      </div>
                      <ArrowUpRight className="icon" />
                    </Link>
                  ))}
                </section>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
