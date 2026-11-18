import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';
import { Loading, ErrorState } from '../components/shared/States';
import {
  Art,
  Button,
  PathCard,
  PlaylistCard,
  SearchForm,
  Intro,
  SectionHead,
  EmptyState,
  ArrowUpRight,
  Play,
  Layers,
  Globe,
  Bookmark,
  PenTool,
  Code,
  Sparkles,
  BookOpen,
} from './Common';
export const categories = [
  {
    id: 'ai',
    name: 'AI / Machine Learning',
    subtitle: 'Explore intelligent systems.',
    topics: 'AI / Machine Learning / Models',
    icon: Sparkles,
    theme: 'violet',
  },
  {
    id: 'design',
    name: 'Design',
    subtitle: 'Make ideas feel intuitive.',
    topics: 'UI/UX · Visual design · Prototyping',
    icon: PenTool,
    theme: 'violet',
  },
  {
    id: 'development',
    name: 'Development',
    subtitle: 'Build something that works.',
    topics: 'Web · Python · Programming',
    icon: Code,
    theme: 'cyan',
  },
  {
    id: 'marketing',
    name: 'Marketing',
    subtitle: 'Connect with the right people.',
    topics: 'Content · Strategy · Digital channels',
    icon: Sparkles,
    theme: 'pink',
  },
  {
    id: 'business',
    name: 'Business',
    subtitle: 'Grow your everyday toolkit.',
    topics: 'Communication · Planning · Presenting',
    icon: Layers,
    theme: 'yellow',
  },
  {
    id: 'exams',
    name: 'Competitive Exams',
    subtitle: 'Prepare with a plan.',
    topics: 'SSC · Banking · Civil services',
    icon: BookOpen,
    theme: 'yellow',
  },
  {
    id: 'productivity',
    name: 'Productivity',
    subtitle: 'Make more of your time.',
    topics: 'Planning / Workflows / Habits',
    icon: Layers,
    theme: 'yellow',
  },
  {
    id: 'data-science',
    name: 'Data Science',
    subtitle: 'Find meaning in data.',
    topics: 'Analysis / Statistics / Visualisation',
    icon: Code,
    theme: 'cyan',
  },
  {
    id: 'cyber-security',
    name: 'Cyber Security',
    subtitle: 'Understand digital security.',
    topics: 'Networks / Security / Systems',
    icon: BookOpen,
    theme: 'mint',
  },
  {
    id: 'finance',
    name: 'Finance',
    subtitle: 'Build financial understanding.',
    topics: 'Finance / Accounting / Planning',
    icon: Layers,
    theme: 'yellow',
  },
  {
    id: 'languages',
    name: 'Language Learning',
    subtitle: 'Open up new conversations.',
    topics: 'Language / Communication',
    icon: BookOpen,
    theme: 'pink',
  },
  {
    id: 'school',
    name: 'School Subjects',
    subtitle: 'Strengthen your foundations.',
    topics: 'Maths / Science / Fundamentals',
    icon: PenTool,
    theme: 'pink',
  },
];
export const inCategory = (category: string, kind: string, id: string) =>
  id === 'exams'
    ? kind === 'exam'
    : kind === 'skill' &&
      (id === 'development'
        ? /tech|develop|program/i.test(category)
        : new RegExp(id, 'i').test(category));
const loadPaths = async () => {
  const [skills, exams] = await Promise.all([api.catalog('skill'), api.catalog('exam')]);
  return [...skills, ...exams];
};
export function ReferenceHome() {
  const paths = useApi(loadPaths, []);
  const featured = paths.data?.find((x) => x.slug === 'ui-ux-design');
  const modules = featured?.modules.slice(0, 4) || [
    'Understand the problem',
    'Structure the experience',
    'Design the interface',
    'Build a prototype',
  ];
  return (
    <div className="container">
      <section className="home-hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="live-dot" />A CLEARER WAY TO LEARN
          </div>
          <h1>
            Learn Skills.
            <br />
            <span>
              Not Search
              <br className="desktop-break" /> for Them.
            </span>
          </h1>
          <p>
            Good resources are everywhere. Find your starting point, follow a path, and build
            something that matters.
          </p>
          <SearchForm hero />
          <div className="popular">
            <span>Start with</span>
            <Link to="/skills/ui-ux-design">
              UI/UX design <ArrowUpRight className="icon" />
            </Link>
            <Link to="/skills/web-development">
              Web development <ArrowUpRight className="icon" />
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="floating-label">
            A little structure.
            <br />
            <b>A lot of possibility.</b>
          </div>
          <div className="journey-card">
            <div className="journey-art">
              <Art title="UI/UX Design" category="Design" />
              <span className="floating-tag">
                YOUR NEXT CHAPTER <Sparkles className="icon" />
              </span>
            </div>
            <div className="journey-body">
              <div className="eyebrow">A PATH, NOT JUST A PLAYLIST</div>
              <h2>
                Become a better
                <br />
                problem solver.
              </h2>
              <div className="journey-stops">
                {modules.map((m, i) => (
                  <div key={m} className={i === 0 ? 'current' : ''}>
                    <span>{i === 0 ? <Play className="icon" /> : `0${i + 1}`}</span>
                    <b>{m}</b>
                    {i === 0 && <ArrowUpRight className="icon" />}
                  </div>
                ))}
              </div>
              <Button to="/skills/ui-ux-design">Explore UI/UX Design</Button>
            </div>
          </div>
          <div className="tiny-card">
            <Layers className="icon" />
            <span>
              One goal.
              <br />
              <b>A clear next step.</b>
            </span>
          </div>
        </div>
      </section>
      <div className="principle-strip">
        <span>
          <Play className="icon" />
          Free learning resources
        </span>
        <span>
          <Layers className="icon" />A meaningful sequence
        </span>
        <span>
          <Globe className="icon" />
          Hindi &amp; English content
        </span>
        <span>
          <Bookmark className="icon" />
          Your own pace
        </span>
      </div>
      <section className="section">
        <SectionHead
          eyebrow="FIND YOUR DIRECTION"
          title="What will you learn next?"
          to="/categories"
          label="All categories"
        />
        <div className="category-mini-grid">
          {categories.slice(0, 4).map((c) => (
            <Link key={c.id} className={`category-mini ${c.theme}`} to={`/category/${c.id}`}>
              <span className="category-icon">
                <c.icon className="icon" />
              </span>
              <div>
                <h3>{c.name}</h3>
                <p>{c.subtitle}</p>
              </div>
              <ArrowUpRight className="icon" />
            </Link>
          ))}
        </div>
      </section>
      <section className="section paths-home">
        <SectionHead
          eyebrow="START WITH A GOAL"
          title="A path for your next chapter."
          to="/paths"
          label="Explore all paths"
        />
        {paths.loading ? (
          <Loading />
        ) : paths.error ? (
          <ErrorState message={paths.error} />
        ) : (
          <div className="course-grid">
            {['ui-ux-design', 'web-development', 'digital-marketing']
              .map((slug) => paths.data?.find((x) => x.slug === slug))
              .filter((x) => !!x)
              .map((c) => (
                <PathCard key={c.id} item={c} />
              ))}
          </div>
        )}
      </section>
      <section className="how-section">
        <div>
          <span className="eyebrow">LESS FRICTION. MORE MOMENTUM.</span>
          <h2>
            From “where do I start?”
            <br />
            to “what’s next?”
          </h2>
          <p>Explore the whole journey before you begin. Then take it one lesson at a time.</p>
          <Button to="/paths">Find your path</Button>
        </div>
        <div className="how-steps">
          {[
            ['Choose a direction', 'Start with a skill that matters to you.'],
            ['See the bigger picture', 'Understand the modules, level and sequence.'],
            ['Keep moving forward', 'Save your place and return to the next step.'],
          ].map(([h, p], i) => (
            <div key={h}>
              <span>0{i + 1}</span>
              <section>
                <h3>{h}</h3>
                <p>{p}</p>
              </section>
            </div>
          ))}
        </div>
      </section>
      <section className="cta-band">
        <div>
          <span className="eyebrow">START SMALL. STAY CURIOUS.</span>
          <h2>
            Your next skill
            <br />
            starts with one step.
          </h2>
        </div>
        <Button to="/onboarding">Choose my learning goal</Button>
      </section>
    </div>
  );
}
export function Categories() {
  const paths = useApi(loadPaths, []);
  return (
    <div className="container">
      <Intro
        eyebrow="EXPLORE CATEGORIES"
        title="Follow your curiosity."
        description="Choose a direction. We will help you see where it can take you."
      />
      <div className="category-grid">
        {categories.map((c) => (
          <Link className={`category-big ${c.theme}`} key={c.id} to={`/category/${c.id}`}>
            <div className="category-top">
              <span className="category-icon">
                <c.icon className="icon" />
              </span>
              <span>
                {paths.data?.filter((p) => inCategory(p.category, p.kind, c.id)).length || 0} paths
              </span>
            </div>
            <img
              className="category-media"
              src={`/design/${c.id === 'development' ? 'code' : c.id === 'design' ? 'design' : 'marketing'}.png`}
              alt={`${c.name} learning`}
              loading="lazy"
            />
            <h2>{c.name}</h2>
            <p>{c.subtitle}</p>
            <div className="topic-line">{c.topics}</div>
            <span className="category-bottom">
              Explore {c.name.toLowerCase()} <ArrowUpRight className="icon" />
            </span>
          </Link>
        ))}
      </div>
      <div className="soft-banner">
        <div>
          <h3>Not sure where to begin?</h3>
          <p>Choose a learning goal and find your starting point.</p>
        </div>
        <Button secondary to="/onboarding">
          Find a starting point
        </Button>
      </div>
    </div>
  );
}
export function Paths({ kind }: { kind?: 'skill' | 'exam' }) {
  const { id } = useParams();
  const paths = useApi(loadPaths, []);
  const [filter, setFilter] = useState('all');
  const [level, setLevel] = useState('all');
  const selected = categories.find((x) => x.id === id);
  const visible =
    paths.data?.filter(
      (x) =>
        (!kind || x.kind === kind) &&
        (!id || inCategory(x.category, x.kind, id)) &&
        (filter === 'all' || inCategory(x.category, x.kind, filter)) &&
        (level === 'all' || x.level === level),
    ) || [];
  return (
    <div className="container concept-paths">
      {selected ? (
        <section className={`category-hero ${selected.theme}`}>
          <div>
            <span className="eyebrow">EXPLORE / {selected.name.toUpperCase()}</span>
            <h1>
              {selected.id === 'design' ? (
                <>
                  Make things
                  <br />
                  make sense.
                </>
              ) : (
                selected.subtitle
              )}
            </h1>
            <p>
              {selected.topics}. Discover a clear route from the fundamentals to your next practical
              project.
            </p>
            <Link className="text-link" to="/onboarding">
              Find your starting point
              <ArrowUpRight className="icon" />
            </Link>
          </div>
          <div className="category-hero-art">
            <Art
              title={selected.name}
              category={selected.id === 'development' ? 'Technology' : selected.name}
            />
          </div>
        </section>
      ) : (
        <Intro
          eyebrow={kind === 'exam' ? 'COMPETITIVE EXAMS' : 'LEARNING PATHS'}
          title={
            <>
              Learning <span>Paths</span>
            </>
          }
          description="See what to learn, in what order, and what you can build along the way."
        />
      )}
      <div className="mini-feature">
        <span>
          <Layers className="icon" />
          Ordered modules
        </span>
        <span>
          <Globe className="icon" />
          Curated resources
        </span>
        <span>
          <BookOpen className="icon" />
          Learn at your pace
        </span>
      </div>
      <div className="filter-bar">
        <span className="filter-label">Filter paths</span>
        <label>
          <span className="sr-only">Category</span>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Level</span>
          <select value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="all">All levels</option>
            <option>Beginner</option>
            <option>Intermediate</option>
          </select>
        </label>
        <button
          className="clear-btn"
          onClick={() => {
            setFilter('all');
            setLevel('all');
          }}
        >
          Reset
        </button>
        <span className="result-count">{visible.length} paths</span>
      </div>
      {paths.loading ? (
        <Loading />
      ) : paths.error ? (
        <ErrorState message={paths.error} />
      ) : visible.length ? (
        <>
          <SectionHead eyebrow="" title="Explore Learning Paths" />
          <div className="concept-path-grid">
            {visible.slice(0, 4).map((x) => (
              <PathCard key={x.id} item={x} />
            ))}
          </div>
          <section className="concept-section">
            <SectionHead eyebrow="" title="All Learning Paths" />
            <div className="concept-all-paths">
              {visible.map((c) => (
                <Link key={c.id} to={`/${c.kind === 'exam' ? 'exams' : 'skills'}/${c.slug}`}>
                  <span className={`category-icon ${c.category === 'Design' ? 'violet' : 'cyan'}`}>
                    <Layers className="icon" />
                  </span>
                  <div>
                    <h3>{c.title}</h3>
                    <p>{c.summary}</p>
                  </div>
                  <span>
                    <Layers className="icon" />
                    {c.modules.length} modules
                  </span>
                  <span>{c.duration || 'Self-paced'}</span>
                  <b>
                    Start Path <ArrowUpRight className="icon" />
                  </b>
                </Link>
              ))}
            </div>
          </section>
          <div className="concept-help-banner">
            <div>
              <h2>New to learning paths?</h2>
              <p>Choose a path and we will guide you step by step.</p>
              <Button to="/onboarding">Find your direction</Button>
            </div>
            <Layers />
          </div>
        </>
      ) : (
        <EmptyState
          title="No paths match these filters."
          description="Try a different category or learning level."
        />
      )}
    </div>
  );
}
export function Playlists({ all = false }: { all?: boolean }) {
  const data = useApi(() => api.resources(), []);
  const [language, setLanguage] = useState('all');
  const list =
    data.data?.filter(
      (r) => (all || r.kind === 'Playlist') && (language === 'all' || r.language === language),
    ) || [];
  return (
    <div className="container">
      <Intro
        eyebrow="CURATED LEARNING"
        title="Good resources. A better sequence."
        description="Focused videos and playlists to help you take the next step."
      />
      <div className="filter-bar">
        <label>
          Language{' '}
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="all">All languages</option>
            {[...new Set(data.data?.map((r) => r.language))].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <span className="result-count">{list.length} resources</span>
      </div>
      {data.loading ? (
        <Loading />
      ) : data.error ? (
        <ErrorState message={data.error} />
      ) : list.length ? (
        <div className="playlist-grid">
          {list.map((r) => (
            <PlaylistCard key={r.id} resource={r} />
          ))}
        </div>
      ) : (
        <EmptyState title="More curated resources are on the way." />
      )}
    </div>
  );
}
