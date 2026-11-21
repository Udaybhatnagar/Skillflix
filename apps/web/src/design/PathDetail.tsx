import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { api, request } from '../services/api';
import { useLearning } from '../context/LearningState';
import { useAuth } from '../context/Auth';
import { Loading, ErrorState, NotFound } from '../components/shared/States';
import {
  Art,
  Breadcrumb,
  Button,
  SectionHead,
  PlaylistCard,
  Layers,
  Play,
  Clock,
  Bookmark,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Check,
} from './Common';
import { figmaArtwork } from './FigmaAssets';
export function PathDetail({ kind }: { kind: 'exam' | 'skill' }) {
  const { slug = '' } = useParams();
  const course = useApi(() => api.detail(kind, slug), [kind, slug]);
  const roadmap = useApi(() => api.roadmap(kind, slug), [kind, slug]);
  const resources = useApi(() => api.resources(), []);
  const learning = useLearning();
  const { requireAuth } = useAuth();
  const navigate = useNavigate();
  const [startError, setStartError] = useState('');
  if (course.loading) return <Loading />;
  if (course.error) return <ErrorState message={course.error} />;
  const c = course.data;
  if (!c) return <NotFound />;
  const related = resources.data?.filter((r) => r.related_slug === slug) || [];
  const saved = learning.isCourseSaved(c.id);
  const topics = roadmap.data?.stages.flatMap((s) => s.topics) || [];
  const completedTopics = topics.filter((t) =>
    learning.isTopicComplete(roadmap.data?.id || '', t.id),
  ).length;
  const progress = topics.length ? Math.round((completedTopics / topics.length) * 100) : 0;
  const start = () => {
    requireAuth(() => {
      void request(`/me/learning/courses/${c.id}`, { method: 'PUT' })
        .then(() => learning.refresh())
        .catch(() => setStartError('Unable to save your path. Please try again.'));
      const lesson = related[0];
      navigate(
        lesson ? `/learn/${lesson.slug}` : roadmap.data ? `/roadmap/${kind}/${slug}` : '/resources',
      );
    });
  };
  return (
    <div className="container figma-detail-page">
      <Breadcrumb items={[{ label: 'Learning paths', to: '/paths' }, { label: c.title }]} />
      <section className="path-detail-hero">
        <div>
          <div className="pill-row">
            <span className="pill">{c.level}</span>
            <span>{c.category}</span>
            <span>Free resources</span>
          </div>
          <h1>{c.title}</h1>
          <p>{c.overview}</p>
          <div className="path-facts">
            <span>
              <Layers className="icon" />
              {roadmap.data?.stages.length || c.modules.length} modules
            </span>
            <span>
              <Play className="icon" />
              {related.length} resources
            </span>
            <span>
              <Clock className="icon" />
              {c.duration || 'Self-paced'}
            </span>
          </div>
          {startError && <p role="alert">{startError}</p>}
          <div className="button-row">
            <button className="btn" onClick={start}>
              Start roadmap <ArrowRight className="icon" />
            </button>
            <button
              className={`btn secondary ${saved ? 'is-saved' : ''}`}
              aria-pressed={saved}
              onClick={() => learning.toggleCourse(c.id)}
            >
              <Bookmark className="icon" />
              {saved ? 'Saved' : 'Save path'}
            </button>
          </div>
        </div>
        <div className="path-art">
          <Art title={c.title} category={c.category} src={c.thumbnail_url} large />
          <span className="art-caption">A SMALL START. A CLEAR DIRECTION.</span>
        </div>
      </section>
      {kind === 'exam' && (
        <section className="section">
          <SectionHead eyebrow="START LEARNING" title="Videos and playlists." />
          {resources.loading ? (
            <Loading />
          ) : resources.error ? (
            <ErrorState message={resources.error} />
          ) : related.length ? (
            <div className="playlist-grid">
              {related.map((r) => (
                <PlaylistCard key={r.id} resource={r} />
              ))}
            </div>
          ) : (
            <p>Resources for this exam have not been added yet.</p>
          )}
        </section>
      )}
      <div className="detail-layout">
        <div>
          <div className="section-head compact">
            <div>
              <span className="eyebrow">THE BIGGER PICTURE</span>
              <h2>Roadmap modules</h2>
            </div>
            <span className="text-muted">
              {roadmap.data?.stages.length || c.modules.length} modules
            </span>
          </div>
          <p className="section-subtitle">
            Each module builds on the one before it. Preview the topics before you begin.
          </p>
          <div className="module-list">
            {roadmap.loading ? (
              <Loading />
            ) : roadmap.data ? (
              roadmap.data.stages.map((s, i) => (
                <details key={s.id}>
                  <summary>
                    <img
                      className="figma-module-thumbnail"
                      src={figmaArtwork(s.title, c.category)}
                      alt=""
                    />
                    <div>
                      <small>
                        MODULE {i + 1} · {s.topics.length} TOPICS
                      </small>
                      <h3>{s.title}</h3>
                    </div>
                    <Link
                      className="figma-open-module"
                      to={`/roadmap/${kind}/${slug}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Open module
                    </Link>
                    <ChevronDown className="icon" />
                  </summary>
                  <div className="module-body">
                    <p>{s.description}</p>
                    {s.topics.map((topic) => {
                      const linked = resources.data?.find((r) => topic.resourceIds.includes(r.id));
                      return (
                        <div key={topic.id}>
                          <Link
                            className="lesson-row"
                            to={linked ? `/learn/${linked.slug}` : `/roadmap/${kind}/${slug}`}
                          >
                            <span className="lesson-symbol">
                              {learning.isTopicComplete(roadmap.data!.id || '', topic.id) ? (
                                <Check className="icon" />
                              ) : (
                                <Play className="icon" />
                              )}
                            </span>
                            <span>{topic.title}</span>
                            <span className="lesson-type">
                              {topic.hours}h <ChevronRight className="icon" />
                            </span>
                          </Link>
                        </div>
                      );
                    })}
                    <Link className="text-link module-link" to={`/roadmap/${kind}/${slug}`}>
                      View full roadmap <ArrowRight className="icon" />
                    </Link>
                  </div>
                </details>
              ))
            ) : (
              c.modules.map((title, i) => (
                <details key={title}>
                  <summary>
                    <span className="module-number">{String(i + 1).padStart(2, '0')}</span>
                    <h3>{title}</h3>
                    <ChevronDown className="icon" />
                  </summary>
                  <div className="module-body">
                    <p>Explore the curated resources below to start this module.</p>
                  </div>
                </details>
              ))
            )}
          </div>
          {kind === 'skill' && (
            <section className="section">
              <SectionHead eyebrow="TAKE THE NEXT STEP" title="Videos and playlists." />
              {related.length ? (
                <div className="playlist-grid">
                  {related.map((r) => (
                    <PlaylistCard key={r.id} resource={r} />
                  ))}
                </div>
              ) : (
                <p>Resources for this path have not been added yet.</p>
              )}
            </section>
          )}
        </div>
        <aside className="sticky-aside">
          <div className="aside-card">
            <span className="eyebrow">BEFORE YOU BEGIN</span>
            <h3>Curiosity is a good start.</h3>
            <p>{c.guidance || 'Bring a notebook, your curiosity, and time to practise.'}</p>
            <hr />
            <small>YOUR LEARNING OUTCOMES</small>
            {c.outcomes.map((x) => (
              <p key={x} className="mt-3">
                {x}
              </p>
            ))}
            <hr />
            <small>A PATH THAT FITS YOUR PACE</small>
            <p>
              Save your place and return whenever you are ready. Your progress is synced to your
              account.
            </p>
            <button className="btn full" onClick={start}>
              Start learning <ArrowRight className="icon" />
            </button>
          </div>
        </aside>
      </div>
      {!!topics.length && (
        <section className="figma-roadmap-progress">
          <div>
            <h3>Your roadmap progress</h3>
            <p>
              {completedTopics} of {topics.length} topics completed · {progress}%
            </p>
            <div className="progressbar">
              <i style={{ width: `${progress}%` }} />
            </div>
          </div>
          <Link className="text-link" to={`/roadmap/${kind}/${slug}`}>
            Continue roadmap <ArrowRight className="icon" />
          </Link>
        </section>
      )}
    </div>
  );
}
export function PlaylistDetail() {
  const { slug = '' } = useParams();
  const result = useApi(() => api.resource(slug), [slug]);
  const learning = useLearning();
  if (result.loading) return <Loading />;
  if (result.error) return <ErrorState message={result.error} />;
  const r = result.data;
  if (!r) return <NotFound />;
  return (
    <div className="container figma-detail-page figma-playlist-detail">
      <Breadcrumb items={[{ label: 'Playlists', to: '/playlists' }, { label: r.title }]} />
      <section className="path-detail-hero">
        <div>
          <span className="eyebrow">CURATED PLAYLIST / {r.language.toUpperCase()}</span>
          <h1>{r.title}</h1>
          <p>
            {r.description ||
              `Learn with ${r.creator}. Follow the original playlist at your own pace.`}
          </p>
          <div className="path-facts">
            <span>
              <Play className="icon" />
              YouTube playlist
            </span>
            <span>{r.level}</span>
            <span>{r.category}</span>
          </div>
          <div className="button-row">
            <Button to={`/learn/${r.slug}`}>Play first lesson</Button>
            <button
              className="btn secondary"
              aria-pressed={learning.isResourceSaved(r.id)}
              onClick={() => learning.toggleResource(r.id)}
            >
              {learning.isResourceSaved(r.id) ? 'Saved' : 'Save for later'}
            </button>
          </div>
        </div>
        <Art title={r.title} category={r.category} src={r.thumbnail_url} large />
      </section>
      <section className="section">
        <SectionHead eyebrow="" title="Lessons" />
        {r.lessons.length ? (
          <div className="module-list">
            {r.lessons.map((lesson, i) => (
              <Link
                key={lesson.id}
                className="lesson-row"
                to={`/learn/${r.slug}?lesson=${encodeURIComponent(lesson.id)}`}
              >
                <img
                  className="figma-module-thumbnail"
                  src={figmaArtwork(lesson.title, r.category)}
                  alt=""
                />
                <span>
                  {i + 1}. {lesson.title}
                </span>
                <span className="figma-open-module">Watch →</span>
              </Link>
            ))}
          </div>
        ) : (
          <p>The complete lesson list loads from YouTube when you open the player.</p>
        )}
        <p className="sample-note">
          The player includes the full original YouTube playlist, with previous and next lesson
          controls.
        </p>
      </section>
    </div>
  );
}
