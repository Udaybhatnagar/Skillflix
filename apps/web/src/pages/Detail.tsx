import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ResourceCard } from '../components/shared/Cards';
import { Empty, ErrorState, Loading, NotFound } from '../components/shared/States';
import { roadmapHours } from '../data/roadmaps';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import type { Educator } from '../types';
import { useLearning } from '../context/LearningState';
import { useLanguage } from '../context/Language';
function EducatorSection({ educators, slug }: { educators: Educator[]; slug: string }) {
  const related = educators.filter((e) => e.path_slugs.includes(slug));
  return (
    <section className="border-t border-border pt-12">
      <p className="eyebrow">Learn from</p>
      <h2 className="section-title mt-3">Relevant publishers</h2>
      {related.length ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {related.map((e) => (
            <Link key={e.id} className="card block" to={`/teachers/${e.slug}`}>
              <p className="eyebrow">{e.focus}</p>
              <h3 className="mt-3 text-2xl">{e.name}</h3>
              <p className="mt-2 text-sm text-muted">{e.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue">
                View profile <ArrowRight size={15} />
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-sm text-muted">No relevant publisher profile is available yet.</p>
      )}
    </section>
  );
}
export function Detail({ kind }: { kind: 'exam' | 'skill' }) {
  const { t } = useLanguage();
  const { isCourseSaved, toggleCourse } = useLearning();
  const { slug = '' } = useParams();
  const detail = useApi(() => api.detail(kind, slug), [kind, slug]);
  const resources = useApi(() => api.resources(), []);
  const educators = useApi(() => api.educators(), []);
  const roadmapResult = useApi(() => api.roadmap(kind, slug), [kind, slug]);
  if (detail.loading)
    return (
      <main className="container-site">
        <Loading />
      </main>
    );
  if (detail.error)
    return detail.error === 'Not found' ? (
      <NotFound />
    ) : (
      <main className="container-site py-12">
        <ErrorState message={detail.error} />
      </main>
    );
  const item = detail.data;
  if (!item) return <NotFound />;
  const roadmap = roadmapResult.data;
  const related = resources.data?.filter((r) => r.related_slug === slug) || [];
  return (
    <main className="container-site space-y-12 py-12">
      <Link
        to={kind === 'exam' ? '/exams' : '/skills'}
        className="inline-flex items-center gap-2 text-sm font-medium text-blue"
      >
        <ArrowLeft size={16} />
        Back to {kind === 'exam' ? 'exams' : 'skills'}
      </Link>
      <div className="grid gap-10 border-b border-border pb-12 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <p className="eyebrow">
            {item.category} / {kind === 'exam' ? 'Exam guide' : 'Skill path'}
          </p>
          <h1 className="mt-5 text-5xl sm:text-7xl">{item.title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">{item.overview}</p>
          <button
            className="button-outline mt-6"
            aria-pressed={isCourseSaved(item.id)}
            onClick={() => toggleCourse(item.id)}
          >
            {isCourseSaved(item.id) ? t('savedCourse') : t('saveCourse')}
          </button>
          <div className="mt-7 flex gap-3 text-sm">
            <span className="rounded-full bg-softblue px-4 py-2 text-blue">{item.level}</span>
            {item.duration && (
              <span className="rounded-full bg-white px-4 py-2 text-blue">{item.duration}</span>
            )}
          </div>
        </div>
        <aside className="self-end rounded-2xl bg-blue p-8 text-white lg:col-span-4">
          <p className="text-xs font-bold uppercase tracking-widest text-softblue">Start here</p>
          <h2 className="mt-4 text-3xl">Make a simple plan.</h2>
          <p className="mt-4 text-sm leading-6 text-softblue">{item.guidance}</p>
          {roadmap ? (
            <Link
              to="#related-resources"
              onClick={() =>
                document.getElementById('related-resources')?.scrollIntoView({ behavior: 'smooth' })
              }
              className="mt-7 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-blue"
            >
              Start learning <ArrowRight size={16} />
            </Link>
          ) : (
            <Link
              to="/resources"
              className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-white underline"
            >
              Browse resources <ArrowRight size={16} />
            </Link>
          )}
        </aside>
      </div>
      <section id="related-resources" className="scroll-mt-28">
        <p className="eyebrow">Start learning</p>
        <h2 className="section-title mt-3">Videos and playlists</h2>
        {resources.loading ? (
          <Loading />
        ) : resources.error ? (
          <ErrorState message={resources.error} />
        ) : related.length ? (
          <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        ) : (
          <div className="mt-7">
            <Empty message="No related resources have been added yet." />
            <Link to="/resources" className="button-outline mt-5">
              Browse resources
            </Link>
          </div>
        )}
      </section>
      <div className="grid gap-12 lg:grid-cols-2">
        <section>
          <p className="eyebrow">Your direction</p>
          <h2 className="section-title mt-3">
            {kind === 'exam' ? 'Preparation outcomes' : 'Learning outcomes'}
          </h2>
          <ul className="mt-6 space-y-4">
            {item.outcomes.map((x) => (
              <li key={x} className="flex gap-3 text-muted">
                <Check size={18} className="mt-1 shrink-0 text-blue" />
                {x}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <p className="eyebrow">The structure</p>
          <h2 className="section-title mt-3">
            {kind === 'exam' ? 'Subject breakdown' : 'Module breakdown'}
          </h2>
          <ol className="mt-6 divide-y divide-border border-y border-border">
            {item.modules.map((x, i) => (
              <li key={x} className="flex gap-5 py-4">
                <span className="text-sm font-semibold text-blue">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {x}
              </li>
            ))}
          </ol>
        </section>
      </div>
      {kind === 'skill' && (
        <section className="grid gap-6 rounded-2xl border border-border bg-white p-7 md:grid-cols-2">
          <div>
            <p className="eyebrow">Who this is for</p>
            <h2 className="mt-2 text-2xl">Target learners</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Learners who want a practical introduction to {item.title.toLowerCase()} and can spend
              time on small exercises.
            </p>
          </div>
          <div>
            <p className="eyebrow">Before you begin</p>
            <h2 className="mt-2 text-2xl">Prerequisites</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              A computer, internet access, and time to practice. Start with basic digital skills; no
              formal credential is assumed.
            </p>
          </div>
        </section>
      )}
      {roadmap && (
        <section className="rounded-2xl bg-softblue/50 p-8">
          <p className="eyebrow">Learning roadmap</p>
          <h2 className="section-title mt-3">A clear path, one stage at a time.</h2>
          <p className="mt-3 text-sm text-muted">
            {roadmap.stages.length} ordered stages · about {roadmapHours(roadmap)} study hours ·
            progress saved to your account
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {roadmap.stages.map((s, i) => (
              <span
                key={s.id}
                className="rounded-full border border-blue/20 bg-white px-3 py-2 text-xs text-blue"
              >
                {i + 1}. {s.title}
              </span>
            ))}
          </div>
          <Link to={`/roadmap/${kind}/${slug}`} className="button-primary mt-7">
            Open roadmap <ArrowRight size={16} />
          </Link>
        </section>
      )}
      {educators.loading ? (
        <Loading />
      ) : educators.error ? (
        <ErrorState message={educators.error} />
      ) : (
        <EducatorSection educators={educators.data || []} slug={slug} />
      )}
    </main>
  );
}
