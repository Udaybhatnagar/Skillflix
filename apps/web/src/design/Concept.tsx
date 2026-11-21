import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';
import { Loading, ErrorState } from '../components/shared/States';
import { categories, inCategory } from './Discovery';
import { figmaAssets } from './FigmaAssets';
import {
  Button,
  PlaylistCard,
  SectionHead,
  Intro,
  EmptyState,
  ArrowRight,
  Play,
  Layers,
  Check,
  Clock,
  Sparkles,
} from './Common';
const loadPaths = async () => {
  const [a, b] = await Promise.all([api.catalog('skill'), api.catalog('exam')]);
  return [...a, ...b];
};
export function ConceptCategories() {
  const paths = useApi(loadPaths, []);
  const resources = useApi(() => api.resources(), []);
  return (
    <div className="container concept-browse">
      <div className="concept-page-banner">
        <Intro
          eyebrow="BROWSE BY TOPIC"
          title={<>Explore Categories</>}
          description="Explore free courses and playlists by skill or subject."
        />
        <img
          className="figma-banner-image"
          src={figmaAssets.categories}
          alt="Books, a graduation cap and a learning video"
        />
      </div>
      {paths.error && <ErrorState message={paths.error} />}
      <div className="concept-category-grid">
        {[...categories]
          .sort(
            (a, b) =>
              [
                'development',
                'design',
                'ai',
                'business',
                'marketing',
                'productivity',
                'data-science',
                'cyber-security',
                'finance',
                'languages',
                'school',
                'exams',
              ].indexOf(a.id) -
              [
                'development',
                'design',
                'ai',
                'business',
                'marketing',
                'productivity',
                'data-science',
                'cyber-security',
                'finance',
                'languages',
                'school',
                'exams',
              ].indexOf(b.id),
          )
          .map((c) => (
            <Link className={`concept-category ${c.theme}`} key={c.id} to={`/category/${c.id}`}>
              <span className="category-icon">
                <c.icon className="icon" />
              </span>
              <div>
                <h3>{c.id === 'development' ? 'Programming' : c.name}</h3>
                <p>
                  {paths.data?.filter((x) => inCategory(x.category, x.kind, c.id)).length || 0}{' '}
                  learning paths
                </p>
              </div>
            </Link>
          ))}
      </div>
      <div className="concept-help-banner">
        <div>
          <h2>Not sure where to start?</h2>
          <p>Take a short guided step and find your next learning path.</p>
          <Button to="/onboarding">Find My Path</Button>
        </div>
        <img
          className="figma-guidance-image"
          src={figmaAssets.guidance}
          alt="A learner choosing a learning path"
        />
      </div>
      <section className="concept-section">
        <SectionHead eyebrow="" title="Trending Right Now" to="/resources" label="View all" />
        {resources.loading ? (
          <Loading />
        ) : resources.error ? (
          <ErrorState message={resources.error} />
        ) : (
          <div className="concept-resource-grid">
            {resources.data?.slice(0, 4).map((r) => (
              <PlaylistCard key={r.id} resource={r} />
            ))}
          </div>
        )}
      </section>
      <div className="figma-category-benefits">
        <h2>Why learn with Skillflix?</h2>
        <div>
          {[
            [Check, '100% Free', 'Curated videos'],
            [Layers, 'Structured Learning', 'Roadmaps and playlists'],
            [Clock, 'Track Progress', 'Stay consistent'],
            [Sparkles, 'Learn at Your Pace', 'Choose your next step'],
          ].map(([Icon, title, copy]) => {
            const I = Icon as typeof Play;
            return (
              <div key={title as string}>
                <I className="icon" />
                <span>
                  <b>{title as string}</b>
                  <small>{copy as string}</small>
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <section className="concept-cta">
        <div>
          <h2>Ready to master a new skill?</h2>
          <p>Choose your direction and start learning today.</p>
        </div>
        <Button to="/paths">Start Learning Now</Button>
      </section>
    </div>
  );
}
export function ConceptPlaylists({ all = false }: { all?: boolean }) {
  const data = useApi(() => api.resources(), []);
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('');
  const [language, setLanguage] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('title');
  const [creator, setCreator] = useState('');
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  useEffect(() => setPage(1), [all, query, level, language, category, creator, sort]);
  const list = (data.data || [])
    .filter(
      (r) =>
        (all || r.kind === 'Playlist') &&
        (!query || `${r.title} ${r.creator}`.toLowerCase().includes(query.toLowerCase())) &&
        (!level || r.level === level) &&
        (!language || r.language === language) &&
        (!creator || r.creator === creator) &&
        (!category || r.category === category),
    )
    .sort((a, b) =>
      sort === 'title' ? a.title.localeCompare(b.title) : a.creator.localeCompare(b.creator),
    );
  return (
    <div
      className={`container concept-browse figma-playlists ${filtersOpen ? 'filters-open' : ''}`}
    >
      <div className="concept-page-banner">
        <Intro
          eyebrow="CURATED ON YOUTUBE"
          title={all ? 'Videos & Playlists' : 'Playlists'}
          description="Find a playlist by topic, level, creator or language."
        />
        <img
          className="figma-banner-image"
          src={figmaAssets.playlists}
          alt="A collection of video playlists"
        />
      </div>
      <div className="concept-list-toolbar">
        <input
          aria-label="Search playlists"
          placeholder="Search playlists..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          className="btn secondary"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          Filters
        </button>
        <select aria-label="Sort playlists" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="title">Sort by: Title</option>
          <option value="creator">Sort by: Creator</option>
        </select>
      </div>
      <div className="concept-filter-chips">
        <button className={!category ? 'active' : ''} onClick={() => setCategory('')}>
          All
        </button>
        {[...new Set(data.data?.map((r) => r.category))].map((c) => (
          <button key={c} className={category === c ? 'active' : ''} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
      </div>
      <div className="concept-results-layout">
        <aside className="concept-filters">
          <h3>Filters</h3>
          <fieldset>
            <legend>Level</legend>
            {['Beginner', 'Intermediate', 'Advanced'].map((l) => (
              <label key={l}>
                <input
                  type="radio"
                  name="playlist-level"
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
              {[...new Set(data.data?.map((r) => r.language))].map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </label>
          <label className="filter-select">
            Creator
            <select value={creator} onChange={(e) => setCreator(e.target.value)}>
              <option value="">All creators</option>
              {[...new Set(data.data?.map((r) => r.creator))].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <button
            className="btn secondary full"
            onClick={() => {
              setLevel('');
              setLanguage('');
              setCategory('');
              setQuery('');
              setCreator('');
            }}
          >
            Reset Filters
          </button>
        </aside>
        <section>
          {data.loading ? (
            <Loading />
          ) : data.error ? (
            <ErrorState message={data.error} />
          ) : list.length ? (
            <>
              <p className="concept-result-count">{list.length} resources</p>
              <div className="concept-playlist-list">
                {list.slice((page - 1) * 8, page * 8).map((r) => (
                  <PlaylistCard key={r.id} resource={r} />
                ))}
              </div>
              {list.length > 8 && (
                <nav className="figma-pagination" aria-label="Resource pages">
                  <button disabled={page === 1} onClick={() => setPage(page - 1)}>
                    Previous
                  </button>
                  {Array.from({ length: Math.ceil(list.length / 8) }, (_, i) => (
                    <button
                      aria-current={page === i + 1 ? 'page' : undefined}
                      key={i}
                      onClick={() => setPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    disabled={page >= Math.ceil(list.length / 8)}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </button>
                </nav>
              )}
            </>
          ) : (
            <EmptyState title="No resources match these filters." />
          )}
        </section>
      </div>
      <div className="concept-help-banner figma-request-banner">
        <div>
          <h2>Can’t find what you want?</h2>
          <p>Suggest a playlist and we’ll review it.</p>
          <Link className="text-link" to="/contact">
            Suggest a playlist <ArrowRight className="icon" />
          </Link>
        </div>
        <img
          className="figma-guidance-image"
          src={figmaAssets.request}
          alt="A clipboard for playlist suggestions"
        />
      </div>
    </div>
  );
}
