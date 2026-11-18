import { Link, Navigate } from 'react-router-dom';
import { ResourceCard, CatalogCard } from '../components/shared/Cards';
import { Empty, ErrorState, Loading } from '../components/shared/States';
import { useLearning } from '../context/LearningState';
import { useAuth } from '../context/Auth';
import { useLanguage } from '../context/Language';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import type { Roadmap } from '../types/roadmap';
export function MyLearning() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { state, loading: progressLoading } = useLearning();
  const resources = useApi(() => api.resources(), []);
  const roadmaps = useApi(() => api.roadmaps(), []);
  const courses = useApi(
    async () => [...(await api.catalog('exam')), ...(await api.catalog('skill'))],
    [],
  );
  const activeIds =
    roadmaps.data?.filter(
      (r) => r.id && (state.roadmapKeys.includes(r.id) || state.completedTopics[r.id]?.length),
    ) || [];
  const detail = useApi(
    () => Promise.all(activeIds.map((r) => api.roadmap(r.type, r.slug))),
    [activeIds.map((x) => x.id).join(',')],
  );
  if (authLoading)
    return (
      <main className="container-site">
        <Loading />
      </main>
    );
  if (!user) return <Navigate to="/login?returnTo=%2Fmy-learning" replace />;
  const savedResources = resources.data?.filter((r) => state.resourceIds.includes(r.id)) || [];
  const savedCourses = courses.data?.filter((c) => state.courseIds.includes(c.id)) || [];
  const lessonCount = state.lessons.filter((x) => x.completed_at).length;
  const topicCount = Object.values(state.completedTopics).reduce(
    (sum, items) => sum + items.length,
    0,
  );
  const activity = state.activity.slice(0, 8);
  const recentLesson = state.activity.find((x) => x.action === 'lesson_opened' && x.resource_id);
  const recentResource = resources.data?.find((x) => x.id === recentLesson?.resource_id);
  return (
    <main className="container-site space-y-12 py-14">
      <header>
        <p className="eyebrow">Your space</p>
        <h1 className="mt-4 text-5xl sm:text-6xl">{t('myLearning')}</h1>
        <p className="mt-5 max-w-2xl text-muted">
          Continue your paths, revisit saved resources, and track progress from your account.
        </p>
      </header>
      {progressLoading && <Loading />}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="eyebrow">{t('savedCourses')}</p>
          <p className="mt-3 text-4xl text-blue">{state.courseIds.length}</p>
        </div>
        <div className="card">
          <p className="eyebrow">{t('topicsComplete')}</p>
          <p className="mt-3 text-4xl text-blue">{topicCount}</p>
        </div>
        <div className="card">
          <p className="eyebrow">{t('lessonsComplete')}</p>
          <p className="mt-3 text-4xl text-blue">{lessonCount}</p>
        </div>
      </div>
      {recentResource && (
        <section className="rounded-2xl bg-blue p-7 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-softblue">
            Resume your last lesson
          </p>
          <h2 className="mt-3 text-3xl">{recentResource.title}</h2>
          <p className="mt-2 text-sm text-softblue">
            Last opened{' '}
            {recentLesson?.created_at ? new Date(recentLesson.created_at).toLocaleDateString() : ''}
          </p>
          <Link
            className="mt-5 inline-flex rounded-lg bg-white px-5 py-3 text-sm font-semibold text-blue"
            to={`/learn/${recentResource.slug}`}
          >
            Continue lesson
          </Link>
        </section>
      )}
      <section>
        <h2 className="section-title">{t('continue')}</h2>
        {roadmaps.loading || detail.loading ? (
          <Loading />
        ) : roadmaps.error || detail.error ? (
          <ErrorState message={roadmaps.error || detail.error} />
        ) : detail.data?.length ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {detail.data.map((r: Roadmap) => {
              const topics = r.stages.flatMap((s) => s.topics),
                done = topics.filter((t) =>
                  (state.completedTopics[r.id || ''] || []).includes(t.id),
                ).length,
                next = topics.find(
                  (t) => !(state.completedTopics[r.id || ''] || []).includes(t.id),
                ),
                percent = topics.length ? Math.round((done / topics.length) * 100) : 0;
              return (
                <Link key={r.id} className="card block" to={`/roadmap/${r.type}/${r.slug}`}>
                  <p className="eyebrow">
                    {r.type} · {percent}% complete
                  </p>
                  <h3 className="mt-4 text-2xl">{r.title}</h3>
                  <div
                    className="mt-5 h-2 rounded-full bg-softblue"
                    role="progressbar"
                    aria-label={`${r.title} progress`}
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div className="h-full rounded-full bg-blue" style={{ width: `${percent}%` }} />
                  </div>
                  <p className="mt-4 text-sm text-muted">
                    {done} of {topics.length} topics complete
                  </p>
                  <p className="mt-3 text-sm text-blue">
                    {next ? `Next: ${next.title}` : 'Path completed'}
                  </p>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="mt-6">
            <Empty message="No active roadmaps yet. Explore a path and save it to begin." />
            <Link className="button-outline mt-5" to="/skills">
              Explore learning paths
            </Link>
          </div>
        )}
      </section>
      <section className="border-t border-border pt-10">
        <h2 className="section-title">{t('myCourses')}</h2>
        {courses.loading ? (
          <Loading />
        ) : courses.error ? (
          <ErrorState message={courses.error} />
        ) : savedCourses.length ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {savedCourses.map((c) => (
              <CatalogCard key={c.id} item={c} />
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <Empty message="Save a course to keep it here." />
          </div>
        )}
      </section>
      <section className="border-t border-border pt-10">
        <h2 className="section-title">{t('bookmarkedResources')}</h2>
        {resources.loading ? (
          <Loading />
        ) : resources.error ? (
          <ErrorState message={resources.error} />
        ) : savedResources.length ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {savedResources.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <Empty message="Nothing bookmarked yet." />
            <Link className="button-outline mt-5" to="/resources">
              Explore resources
            </Link>
          </div>
        )}
      </section>
      <section className="border-t border-border pt-10">
        <h2 className="section-title">{t('recentActivity')}</h2>
        {activity.length ? (
          <ul className="mt-6 divide-y divide-border">
            {activity.map((item, index) => (
              <li
                className="flex justify-between gap-4 py-3 text-sm"
                key={`${item.created_at}-${index}`}
              >
                <span className="capitalize">{item.action.replaceAll('_', ' ')}</span>
                <time className="text-muted">{new Date(item.created_at).toLocaleDateString()}</time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-5 text-sm text-muted">Your recent learning activity will appear here.</p>
        )}
      </section>
    </main>
  );
}
