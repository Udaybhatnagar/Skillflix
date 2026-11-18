import { ArrowRight, Compass, Library, Map, Check, Play, BookOpen, Sparkles } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CatalogCard, ResourceCard } from '../components/shared/Cards';
import { Loading, ErrorState } from '../components/shared/States';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import { useLanguage } from '../context/Language';
import { useAuth } from '../context/Auth';
export function Home() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const exams = useApi(() => api.catalog('exam'), []);
  const skills = useApi(() => api.catalog('skill'), []);
  const resources = useApi(() => api.resources(), []);
  const educators = useApi(() => api.educators(), []);
  function submit(e: FormEvent) {
    e.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  }
  return (
    <main>
      <section className="container-site home-hero grid items-center gap-12 py-14 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-7">
          <p className="eyebrow">A LITTLE DIRECTION. A LOT OF POSSIBILITY.</p>
          <h1 className="mt-6 max-w-3xl text-5xl leading-[1.08] sm:text-6xl lg:text-7xl">
            Your ambition.
            <br />A clearer <span className="text-blue">way forward.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-muted">{t('heroCopy')}</p>
          <form
            onSubmit={submit}
            role="search"
            className="mt-10 flex max-w-xl flex-col gap-3 sm:flex-row"
          >
            <input
              className="input flex-1"
              aria-label="Search exams, skills and resources"
              placeholder={t('searchPlaceholder')}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button className="button-primary">
              {t('search')} <ArrowRight size={17} />
            </button>
          </form>
          {!authLoading && !user && (
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link to="/signup" className="button-primary">
                Create your free account <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="text-sm font-semibold text-blue hover:underline">
                Already learning? Log in
              </Link>
            </div>
          )}
          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-muted">
            <span className="flex items-center gap-2">
              <Check size={14} className="text-blue" />
              Structured roadmaps
            </span>
            <span className="flex items-center gap-2">
              <Check size={14} className="text-blue" />
              Curated lessons
            </span>
            <span className="flex items-center gap-2">
              <Check size={14} className="text-blue" />
              Progress that stays with you
            </span>
          </div>
        </div>
        <aside className="learning-board lg:col-span-5" aria-label="Discover your learning path">
          <div className="flex items-center justify-between border-b border-border pb-5">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted">
              <Sparkles size={16} className="text-blue" /> The learning studio
            </span>
            <span className="rounded-full bg-softblue px-3 py-1 text-[10px] font-semibold text-blue">
              Find your focus
            </span>
          </div>
          <h2 className="mt-6 text-2xl">Big goals. Small steps.</h2>
          <p className="mt-2 text-sm text-muted">Pick a direction. We will help you map the rest.</p>
          <div className="board-path mt-7">
            <div className="board-step">
              <span className="board-step-icon">
                <Compass size={18} />
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  01 / Discover
                </span>
                <p className="mt-1 text-sm font-semibold">A goal worth working toward</p>
              </div>
            </div>
            <div className="board-step">
              <span className="board-step-icon">
                <Map size={18} />
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  02 / Follow your roadmap
                </span>
                <p className="mt-1 text-sm font-semibold">Know exactly what comes next</p>
              </div>
            </div>
            <div className="board-step">
              <span className="board-step-icon">
                <Play size={18} />
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  03 / Learn and grow
                </span>
                <p className="mt-1 text-sm font-semibold">One focused lesson at a time</p>
              </div>
            </div>
          </div>
          <Link to="/skills/ui-ux-design" className="board-feature mt-7">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/15">
              <BookOpen size={20} />
            </span>
            <div className="flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-200">
                Explore a learning path
              </p>
              <p className="mt-1 text-sm font-semibold">UI/UX Design</p>
            </div>
            <ArrowRight size={19} />
          </Link>
        </aside>
      </section>
      <section
        className="container-site grid gap-5 pb-6 md:grid-cols-2"
        aria-label="Two ways to move forward"
      >
        <Link to="/exams" className="discovery-tile discovery-exams">
          <div>
            <p className="eyebrow">Competitive exams</p>
            <h2 className="mt-3 text-2xl">Prepare with purpose.</h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-muted">
              From the first chapter to final revision. Build a preparation plan you can follow.
            </p>
          </div>
          <span className="discovery-arrow">
            <ArrowRight size={20} />
          </span>
        </Link>
        <Link to="/skills" className="discovery-tile discovery-skills">
          <div>
            <p className="eyebrow">Professional skills</p>
            <h2 className="mt-3 text-2xl">Make room for what is next.</h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-muted">
              Design, code, create. Turn your curiosity into practical skills and new possibilities.
            </p>
          </div>
          <span className="discovery-arrow">
            <ArrowRight size={20} />
          </span>
        </Link>
      </section>
      <section className="container-site py-16">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Where to begin</p>
            <h2 className="section-title mt-3">Popular learning paths</h2>
          </div>
          <Link to="/skills" className="text-sm font-semibold text-blue hover:underline">
            View all paths
          </Link>
        </div>
        {skills.loading ? (
          <Loading />
        ) : skills.error ? (
          <ErrorState message={skills.error} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...(exams.data || []), ...(skills.data || [])]
              .filter((x) =>
                ['ssc-cgl', 'ibps-po', 'ui-ux-design', 'web-development', 'python'].includes(
                  x.slug,
                ),
              )
              .map((x) => (
                <CatalogCard key={x.id} item={x} />
              ))}
          </div>
        )}
      </section>
      <section className="border-y border-border bg-white">
        <div className="container-site grid gap-10 py-16 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Focused preparation</p>
            <h2 className="section-title mt-3">Explore competitive exams</h2>
            <p className="mt-4 max-w-md text-muted">
              Build your plan around core topics and trustworthy sources. Always confirm current
              requirements with the official exam body.
            </p>
            <Link to="/exams" className="button-outline mt-6">
              Browse exams <ArrowRight size={16} />
            </Link>
          </div>
          {exams.loading ? (
            <Loading />
          ) : exams.error ? (
            <ErrorState message={exams.error} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {exams.data
                ?.filter((x) => ['ssc-cgl', 'ibps-po'].includes(x.slug))
                .map((x) => (
                  <CatalogCard key={x.id} item={x} />
                ))}
            </div>
          )}
        </div>
      </section>
      <section className="container-site py-16">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">From the library</p>
            <h2 className="section-title mt-3">Recently added resources</h2>
          </div>
          <Link to="/resources" className="text-sm font-semibold text-blue hover:underline">
            Browse all resources
          </Link>
        </div>
        {resources.loading ? (
          <Loading />
        ) : resources.error ? (
          <ErrorState message={resources.error} />
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {resources.data?.slice(0, 3).map((x) => (
              <ResourceCard key={x.id} resource={x} />
            ))}
          </div>
        )}
      </section>
      <section className="border-y border-border bg-softblue/50">
        <div className="container-site py-16">
          <p className="eyebrow">The approach</p>
          <h2 className="section-title mt-3">How Skillflix works</h2>
          <div className="mt-9 grid gap-8 md:grid-cols-4">
            {[
              [Compass, 'Discover', 'Browse exams, skills, and learning resources in one place.'],
              [Map, 'Find direction', 'Follow roadmaps with ordered stages and topic progress.'],
              [
                Library,
                'Learn from curated educators',
                'Watch relevant lessons without leaving your learning path.',
              ],
              [
                Map,
                'Track progress',
                'Save courses and follow topic and lesson progress in your account.',
              ],
            ].map(([Icon, title, body]) => (
              <div key={title as string}>
                <Icon size={28} className="text-blue" />
                <h3 className="mt-5 text-2xl">{title as string}</h3>
                <p className="mt-3 text-sm leading-6 text-muted">{body as string}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="container-site py-16">
        <p className="eyebrow">People and perspectives</p>
        <h2 className="section-title mt-3">Learning publishers</h2>
        {educators.loading ? (
          <Loading />
        ) : educators.error ? (
          <ErrorState message={educators.error} />
        ) : (
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {educators.data?.map((e) => (
              <Link key={e.id} to={`/teachers/${e.slug}`} className="card block">
                <p className="eyebrow">{e.focus}</p>
                <h3 className="mt-4 text-2xl">{e.name}</h3>
                <p className="mt-2 text-sm text-muted">{e.description}</p>
              </Link>
            ))}
          </div>
        )}
        <Link to="/teachers" className="button-outline mt-6">
          Browse directory <ArrowRight size={16} />
        </Link>
      </section>
      <section className="border-t border-border bg-blue text-white">
        <div className="container-site grid gap-8 py-16 md:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-softblue">
              Why Skillflix
            </p>
            <h2 className="mt-4 text-4xl">A clear path through the noise.</h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-softblue">
              Structured roadmaps, curated videos, focused playback, and real progress tracking
              bring exams and professional skills into one learning space.
            </p>
          </div>
          <div className="flex flex-col justify-center">
            <h2 className="text-3xl">Your next chapter starts with a clear path.</h2>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-blue"
                to="/courses"
              >
                Explore learning paths
              </Link>
              <Link
                className="rounded-lg border border-white px-5 py-3 text-sm font-semibold text-white"
                to="/my-learning"
              >
                Start learning
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
