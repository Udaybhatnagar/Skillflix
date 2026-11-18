import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/Auth';
import { useLearning } from '../context/LearningState';
import { Loading, ErrorState } from '../components/shared/States';
import { categories, inCategory } from './Discovery';
import {
  Art,
  Button,
  PathCard,
  PlaylistCard,
  SectionHead,
  Intro,
  EmptyState,
  ArrowRight,
  Play,
  Layers,
  Bookmark,
  Check,
  Clock,
  Sparkles,
  pathUrl,
} from './Common';
const loadPaths = async () => {
  const [a, b] = await Promise.all([api.catalog('skill'), api.catalog('exam')]);
  return [...a, ...b];
};
export function ConceptHome() {
  const paths = useApi(loadPaths, []);
  const resources = useApi(() => api.resources(), []);
  const { user } = useAuth();
  const { state } = useLearning();
  const featured = resources.data?.find((r) => r.video_id);
  const saved = paths.data?.filter((c) => state.courseIds.includes(c.id)) || [];
  return (
    <div className="container concept-home">
      <section className="concept-hero">
        <div className="concept-hero-copy">
          <span className="concept-kicker">FREE RESOURCES · CURATED · STRUCTURED</span>
          <h1>
            Learn Any Skill for Free.
            <br />
            The <span>Smart</span> Way.
          </h1>
          <p>
            Explore educational videos, structured playlists and roadmaps so you can learn with a
            clear direction and keep your progress in one place.
          </p>
          <div className="concept-benefits">
            <span>
              <Layers className="icon" />
              <b>
                Structured
                <br />
                Learning Paths
              </b>
            </span>
            <span>
              <Bookmark className="icon" />
              <b>
                Save Progress
                <br />
                Track &amp; Continue
              </b>
            </span>
            <span>
              <Play className="icon" />
              <b>
                Curated
                <br />
                YouTube Content
              </b>
            </span>
          </div>
          <div className="button-row">
            <Button to={user ? '/my-learning' : '/signup'}>Start Learning Now</Button>
            <Button secondary to="/categories">
              Explore Categories
            </Button>
          </div>
          <p className="concept-hero-note">
            <Check className="icon" />
            Your next chapter starts with one clear step.
          </p>
        </div>
        <div className="concept-preview">
          <span className="preview-sticker">
            <Sparkles className="icon" />A clear path.
            <br />
            Your own pace.
          </span>
          <div className="preview-heading">
            <span className="preview-avatar">
              <Play className="icon" />
            </span>
            <div>
              <strong>{featured?.title || 'Your next learning path'}</strong>
              <small>{featured?.creator || 'Explore the learning library'}</small>
            </div>
            <Link className="btn small" to={featured ? `/learn/${featured.slug}` : '/paths'}>
              <Play className="icon" />
              Watch
            </Link>
          </div>
          <div className="preview-body">
            <ol>
              {[
                'Introduction',
                'Core concepts',
                'Build your skills',
                'Put it into practice',
                'Your next step',
              ].map((title, i) => (
                <li className={i === 1 ? 'active' : ''} key={title}>
                  {i + 1}. {title}
                </li>
              ))}
            </ol>
            <div>
              <Link className="preview-video" to={featured ? `/learn/${featured.slug}` : '/paths'}>
                <img
                  src={
                    featured?.thumbnail_url ||
                    (featured?.video_id
                      ? `https://i.ytimg.com/vi/${featured.video_id}/hqdefault.jpg`
                      : '/design/code.png')
                  }
                  alt={featured?.title || 'Explore learning videos'}
                />
                <span>
                  <Play className="icon" />
                </span>
              </Link>
              <div className="preview-progress">
                <strong>Learning with direction</strong>
                <div className="concept-track">
                  <i />
                </div>
                <small>Discover. Learn. Practise. Grow.</small>
              </div>
            </div>
          </div>
          <span className="preview-bottom-sticker">
            Learn at your pace
            <br />
            <b>Build lasting skills</b>
          </span>
        </div>
      </section>
      <section className="concept-section">
        <SectionHead
          eyebrow=""
          title="Explore Top Categories"
          label="View all categories"
          to="/categories"
        />
        <div className="concept-category-strip">
          {categories
            .filter((c) =>
              ['development', 'design', 'ai', 'business', 'marketing', 'productivity'].includes(
                c.id,
              ),
            )
            .map((c) => (
              <Link className={`concept-category ${c.theme}`} key={c.id} to={`/category/${c.id}`}>
                <span className="category-icon">
                  <c.icon className="icon" />
                </span>
                <div>
                  <h3>{c.name}</h3>
                  <p>
                    {paths.data?.filter((x) => inCategory(x.category, x.kind, c.id)).length || 0}{' '}
                    learning paths
                  </p>
                </div>
              </Link>
            ))}
        </div>
      </section>
      <section className="concept-section">
        <SectionHead
          eyebrow=""
          title="Popular Learning Paths (Roadmaps)"
          to="/paths"
          label="View all roadmaps"
        />
        {paths.loading ? (
          <Loading />
        ) : paths.error ? (
          <ErrorState message={paths.error} />
        ) : (
          <div className="concept-path-grid">
            {paths.data?.slice(0, 5).map((c) => (
              <PathCard key={c.id} item={c} />
            ))}
          </div>
        )}
      </section>
      <section className="concept-section">
        <SectionHead
          eyebrow=""
          title="Continue Learning"
          to="/my-learning"
          label="View your dashboard"
        />
        {user ? (
          saved.length ? (
            <div className="concept-continue-grid">
              {saved.slice(0, 4).map((c) => (
                <Link className="concept-continue" to={pathUrl(c)} key={c.id}>
                  <Art title={c.title} category={c.category} />
                  <div>
                    <h3>{c.title}</h3>
                    <p>
                      {c.level} · {c.duration || 'Self-paced'}
                    </p>
                    <span>
                      Continue your learning <ArrowRight className="icon" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="concept-empty-inline">
              Choose and save a path to start your learning journey.
              <Link className="text-link" to="/paths">
                Explore paths <ArrowRight className="icon" />
              </Link>
            </div>
          )
        ) : (
          <div className="concept-empty-inline">
            <div>
              <h3>Your next step is waiting.</h3>
              <p>Log in to continue lessons and see your saved progress.</p>
            </div>
            <Button secondary to="/login">
              Log in to continue
            </Button>
          </div>
        )}
      </section>
      <section className="concept-section">
        <SectionHead eyebrow="" title="Why Learn with Skillflix?" />
        <div className="concept-reasons">
          {[
            [Bookmark, 'Handpicked Content', 'Resources from named educators.'],
            [Layers, 'Structured Roadmaps', 'Follow topics in a clear sequence.'],
            [Clock, 'Track Your Progress', 'Pick up where you left off.'],
            [Sparkles, 'Learn at Your Pace', 'Build a routine that fits you.'],
            [Play, 'Free Learning Resources', 'Discover educational content.'],
          ].map(([Icon, title, copy]) => {
            const I = Icon as typeof Play;
            return (
              <div key={title as string}>
                <I className="icon" />
                <div>
                  <h3>{title as string}</h3>
                  <p>{copy as string}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <section className="concept-section">
        <SectionHead
          eyebrow=""
          title="Curated Videos & Playlists"
          to="/resources"
          label="Explore all resources"
        />
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
      <section className="concept-cta">
        <div>
          <h2>Ready to start your learning journey?</h2>
          <p>Discover a path and make your next step count.</p>
        </div>
        <Button to={user ? '/onboarding' : '/signup'}>Get Started Free</Button>
      </section>
    </div>
  );
}
export function ConceptCategories() {
  const paths = useApi(loadPaths, []);
  const resources = useApi(() => api.resources(), []);
  return (
    <div className="container concept-browse">
      <div className="concept-page-banner">
        <Intro
          eyebrow="HOME / CATEGORIES"
          title={
            <>
              Explore <span>Categories</span>
            </>
          }
          description="Discover free educational content across skills and subjects."
        />
        <div className="banner-art">
          <Layers />
          <Sparkles />
        </div>
      </div>
      {paths.error && <ErrorState message={paths.error} />}
      <div className="concept-category-grid">
        {categories.map((c) => (
          <Link className={`concept-category ${c.theme}`} key={c.id} to={`/category/${c.id}`}>
            <span className="category-icon">
              <c.icon className="icon" />
            </span>
            <div>
              <h3>{c.name}</h3>
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
        <Sparkles />
      </div>
      <section className="concept-section">
        <SectionHead
          eyebrow=""
          title="Explore Learning Resources"
          to="/resources"
          label="View all"
        />
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
  const list = (data.data || [])
    .filter(
      (r) =>
        (all || r.kind === 'Playlist') &&
        (!query || `${r.title} ${r.creator}`.toLowerCase().includes(query.toLowerCase())) &&
        (!level || r.level === level) &&
        (!language || r.language === language) &&
        (!category || r.category === category),
    )
    .sort((a, b) =>
      sort === 'title' ? a.title.localeCompare(b.title) : a.creator.localeCompare(b.creator),
    );
  return (
    <div className="container concept-browse">
      <div className="concept-page-banner">
        <Intro
          eyebrow="HOME / PLAYLISTS"
          title={<span>{all ? 'Videos & Playlists' : 'Playlists'}</span>}
          description="Curated resources to help you learn better."
        />
        <div className="banner-art">
          <Play />
          <Layers />
        </div>
      </div>
      <div className="concept-list-toolbar">
        <input
          aria-label="Search playlists"
          placeholder="Search playlists..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
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
          <button
            className="btn secondary full"
            onClick={() => {
              setLevel('');
              setLanguage('');
              setCategory('');
              setQuery('');
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
                {list.map((r) => (
                  <PlaylistCard key={r.id} resource={r} />
                ))}
              </div>
            </>
          ) : (
            <EmptyState title="No resources match these filters." />
          )}
        </section>
      </div>
    </div>
  );
}
