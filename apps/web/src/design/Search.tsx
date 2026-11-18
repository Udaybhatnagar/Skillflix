import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import { Loading, ErrorState } from '../components/shared/States';
import { Intro, SearchForm, PathCard, PlaylistCard, EmptyState, ArrowUpRight } from './Common';
export function ReferenceSearch() {
  const [params] = useSearchParams();
  const query = params.get('q') || '';
  const [tab, setTab] = useState('Paths');
  const data = useApi(
    () =>
      query
        ? api.search(query)
        : Promise.resolve({ catalog: [], resources: [], educators: [], topics: [] }),
    [query],
  );
  const resources =
    data.data?.resources.filter((r) => r.kind === (tab === 'Playlists' ? 'Playlist' : 'Video')) ||
    [];
  return (
    <div className="container">
      <Intro
        eyebrow="SEARCH"
        title="Find your next learning step."
        description="Start with a topic, a skill, or something you want to make."
      />
      <SearchForm key={query} initial={query} />
      <div className="tabs search-tabs" role="tablist">
        {['Paths', 'Playlists', 'Videos', 'Creators', 'Topics'].map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={tab === t ? 'active' : ''}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {data.loading ? (
        <Loading />
      ) : data.error ? (
        <ErrorState message={data.error} />
      ) : (
        <>
          <div className="search-results-heading">
            <h3>{query ? `Results for “${query}”` : 'Explore a starting point'}</h3>
          </div>
          {tab === 'Paths' ? (
            data.data?.catalog.length ? (
              <div className="course-grid">
                {data.data.catalog.map((c) => (
                  <PathCard key={c.id} item={c} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No matching paths yet."
                description="Try a broader topic such as design, Python, or SSC."
              />
            )
          ) : tab === 'Creators' ? (
            data.data?.educators?.length ? (
              <div className="course-grid">
                {data.data.educators.map((e) => (
                  <Link className="aside-card" key={e.id} to={`/teachers/${e.slug}`}>
                    <span className="eyebrow">{e.focus}</span>
                    <h3 className="mt-3">{e.name}</h3>
                    <p>{e.description}</p>
                    <ArrowUpRight className="icon mt-4" />
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState title="No matching creators." />
            )
          ) : tab === 'Topics' ? (
            data.data?.topics?.length ? (
              <div className="course-grid">
                {data.data.topics.map((t) => (
                  <Link className="aside-card" key={t.id} to={`/roadmap/${t.type}/${t.slug}`}>
                    <h3>{t.title}</h3>
                    <p>{t.description}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState title="No matching topics." />
            )
          ) : resources.length ? (
            <div className="playlist-grid">
              {resources.map((r) => (
                <PlaylistCard key={r.id} resource={r} />
              ))}
            </div>
          ) : (
            <EmptyState title={`No matching ${tab.toLowerCase()}.`} />
          )}
        </>
      )}
    </div>
  );
}
