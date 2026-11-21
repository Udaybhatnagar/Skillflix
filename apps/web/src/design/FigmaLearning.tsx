import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import { useLearning } from '../context/LearningState';
import { AccountLayout } from './Account';
import {
  Art,
  Button,
  EmptyState,
  SectionHead,
  Play,
  Check,
  Bookmark,
  Clock,
  ArrowRight,
  pathUrl,
} from './Common';
import { ErrorState, Loading } from '../components/shared/States';
import type { Resource } from '../types';
import { figmaArtwork } from './FigmaAssets';

export function FigmaLearning() {
  const { state, error, loading } = useLearning();
  const paths = useApi(
    async () => [...(await api.catalog('skill')), ...(await api.catalog('exam'))],
    [],
  );
  const resources = useApi(() => api.resources(), []);
  const roadmaps = useApi(() => api.roadmaps(), []);
  const enrolled =
    paths.data?.filter(
      (c) =>
        state.courseIds.includes(c.id) ||
        roadmaps.data?.some(
          (r) =>
            r.slug === c.slug &&
            !!r.id &&
            (state.roadmapKeys.includes(r.id) || !!state.completedTopics[r.id]?.length),
        ),
    ) || [];
  const saved = resources.data?.filter((r) => state.resourceIds.includes(r.id)) || [];
  const enrolledRoadmaps = enrolled.filter((c) =>
    roadmaps.data?.some((r) => r.slug === c.slug && r.type === c.kind),
  );
  const roadmapDetails = useApi(
    () => Promise.all(enrolledRoadmaps.map((c) => api.roadmap(c.kind, c.slug))),
    [enrolledRoadmaps.map((c) => c.id).join(',')],
  );
  const recent = state.lessons
    .map((p) => ({ progress: p, resource: resources.data?.find((r) => r.id === p.resource_id) }))
    .filter(
      (x): x is { progress: (typeof state.lessons)[number]; resource: Resource } => !!x.resource,
    )
    .sort((a, b) => b.progress.updated_at.localeCompare(a.progress.updated_at));
  const finished = state.lessons.filter((l) => l.completed_at).length;
  return (
    <AccountLayout>
      <div className="figma-learning">
        <div className="figma-learning-intro">
          <h1>My Learning</h1>
          <p>Pick up where you left off and keep learning.</p>
        </div>
        {error && <ErrorState message={error} />}
        {loading || paths.loading || resources.loading ? (
          <Loading />
        ) : paths.error || resources.error ? (
          <ErrorState message={paths.error || resources.error} />
        ) : (
          <>
            <section id="continue" className="figma-dashboard-section">
              <SectionHead eyebrow="" title="Continue Learning" to="/paths" label="Explore paths" />
              <div className="figma-dashboard-cards">
                {enrolled.slice(0, 2).map((c) => {
                  const roadmap = roadmapDetails.data?.find((r) => r.slug === c.slug);
                  const topics = roadmap?.stages.flatMap((s) => s.topics) || [];
                  const completed = topics.filter((t) =>
                    (state.completedTopics[roadmap?.id || ''] || []).includes(t.id),
                  );
                  const percent = topics.length
                    ? Math.round((completed.length / topics.length) * 100)
                    : 0;
                  return (
                    <Link className="figma-dashboard-card" key={c.id} to={pathUrl(c)}>
                      <Art title={c.title} category={c.category} src={c.thumbnail_url} />
                      <div>
                        <h3>{c.title}</h3>
                        <p>Learning roadmap</p>
                      </div>
                      <div className="figma-dashboard-card-progress">
                        <div className="progressbar">
                          <i style={{ width: `${percent}%` }} />
                        </div>
                        <p>
                          {completed.length} of {topics.length} topics complete · {percent}%
                        </p>
                        <span>
                          Continue roadmap <ArrowRight className="icon" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
                {recent
                  .slice(0, Math.max(1, 4 - enrolled.slice(0, 2).length))
                  .map(({ progress, resource }) => (
                    <Link
                      key={resource.id}
                      className="figma-dashboard-card"
                      to={`/learn/${resource.slug}`}
                    >
                      <img
                        src={
                          resource.thumbnail_url || figmaArtwork(resource.title, resource.category)
                        }
                        alt=""
                      />
                      <div>
                        <h3>{resource.title}</h3>
                        <p>by {resource.creator}</p>
                      </div>
                      <div className="figma-dashboard-card-progress">
                        <p>
                          {progress.completed_at
                            ? 'Lesson completed'
                            : `Resume at ${Math.floor((progress.last_position_seconds || 0) / 60)}:${String(Math.floor((progress.last_position_seconds || 0) % 60)).padStart(2, '0')}`}
                        </p>
                        <span>
                          Resume lesson <ArrowRight className="icon" />
                        </span>
                      </div>
                    </Link>
                  ))}
              </div>
              {!enrolled.length && !recent.length && (
                <EmptyState
                  title="Your next lesson is waiting"
                  description="Choose a path or playlist to begin."
                  to="/paths"
                  label="Explore learning paths"
                />
              )}
            </section>
            <section className="figma-dashboard-section" id="saved">
              <SectionHead
                eyebrow=""
                title="Saved Playlists & Resources"
                to="/saved"
                label="View all"
              />
              {saved.length ? (
                <div className="figma-saved-table">
                  {saved.slice(0, 5).map((r) => (
                    <article key={r.id}>
                      <Link
                        className="figma-saved-resource"
                        to={r.kind === 'Playlist' ? `/playlist/${r.slug}` : `/learn/${r.slug}`}
                      >
                        <img src={r.thumbnail_url || figmaArtwork(r.title, r.category)} alt="" />
                        <div>
                          <h3>{r.title}</h3>
                          <p>by {r.creator}</p>
                        </div>
                      </Link>
                      <span>{r.kind}</span>
                      <span>
                        {r.language} · {r.level}
                      </span>
                      <Button secondary to={`/learn/${r.slug}`}>
                        Continue
                      </Button>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No saved playlists yet"
                  description="Save a playlist to find it here when you’re ready to keep learning."
                  to="/playlists"
                  label="Explore playlists"
                />
              )}
            </section>
            <div className="figma-dashboard-bottom">
              <section id="history">
                <SectionHead eyebrow="" title="Recent Activity" />
                {state.activity.length ? (
                  <div className="figma-activity-list">
                    {state.activity.slice(0, 5).map((a, i) => {
                      const r = resources.data?.find((r) => r.id === a.resource_id);
                      const c = paths.data?.find((c) => c.id === a.course_id);
                      return (
                        <Link
                          key={`${a.created_at}-${i}`}
                          to={r ? `/learn/${r.slug}` : c ? pathUrl(c) : '/saved'}
                        >
                          <span className="figma-activity-icon">
                            {a.action.includes('completed') ? (
                              <Check className="icon" />
                            ) : a.action.includes('save') ? (
                              <Bookmark className="icon" />
                            ) : (
                              <Play className="icon" />
                            )}
                          </span>
                          <div>
                            <b>{a.action.replace(/_/g, ' ')}</b>
                            <p>{r?.title || c?.title || 'Your learning activity'}</p>
                          </div>
                          <small>
                            {new Date(a.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </small>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <p>Your activity appears here as you learn.</p>
                )}
              </section>
              <section id="progress">
                <SectionHead eyebrow="" title="Learning Stats" />
                <div className="figma-learning-stats">
                  {[
                    [Clock, recent.length, 'Lessons started'],
                    [Check, finished, 'Lessons completed'],
                    [Bookmark, saved.length, 'Saved resources'],
                  ].map(([Icon, value, label]) => {
                    const I = Icon as typeof Play;
                    return (
                      <div key={label as string}>
                        <I className="icon" />
                        <b>{value as number}</b>
                        <small>{label as string}</small>
                      </div>
                    );
                  })}
                </div>
                <div className="figma-learning-encouragement">
                  🌱
                  <div>
                    <b>Small progress every day leads to big results.</b>
                    <p>Keep going! You’re doing great!</p>
                  </div>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </AccountLayout>
  );
}
