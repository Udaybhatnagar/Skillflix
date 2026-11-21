import { useState, type ReactNode, type FormEvent } from 'react';
import { Link, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/Auth';
import { useLearning } from '../context/LearningState';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import { Loading, ErrorState } from '../components/shared/States';
import {
  Art,
  PathCard,
  PlaylistCard,
  EmptyState,
  Button,
  BookOpen,
  Bookmark,
  User,
  Sparkles,
  ArrowUpRight,
  ArrowRight,
  Check,
} from './Common';
const loadPaths = async () => {
  const [a, b] = await Promise.all([api.catalog('skill'), api.catalog('exam')]);
  return [...a, ...b];
};
export function AccountLayout({ children }: { children: ReactNode }) {
  const { pathname, hash } = useLocation();
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user)
    return <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname)}`} replace />;
  return (
    <div className="container account-layout">
      <aside className="account-sidebar">
        <Link className="account-person" to="/profile">
          <span className="avatar large">{user.full_name[0]}</span>
          <span>
            <b>{user.full_name}</b>
            <small>Your learning space</small>
          </span>
        </Link>
        {[
          [BookOpen, 'My learning', '/my-learning'],
          [BookOpen, 'Continue Learning', '/my-learning#continue'],
          [Bookmark, 'Saved resources', '/saved'],
          [BookOpen, 'Watch History', '/my-learning#history'],
          [Sparkles, 'My Progress', '/my-learning#progress'],
          [User, 'Profile & preferences', '/profile'],
        ].map(([Icon, label, to]) => {
          const I = Icon as typeof User;
          return (
            <NavLink
              key={to as string}
              to={to as string}
              className={() => {
                const [targetPath, targetHash = ''] = (to as string).split('#');
                return pathname === targetPath && hash === (targetHash ? `#${targetHash}` : '')
                  ? 'active'
                  : '';
              }}
              onClick={() => {
                const target = (to as string).split('#')[1];
                if (target)
                  requestAnimationFrame(() =>
                    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' }),
                  );
              }}
            >
              <I className="icon" />
              {label as string}
            </NavLink>
          );
        })}
        <div className="sidebar-tip">
          <Sparkles className="icon" />
          <h4>Small steps count.</h4>
          <p>A little focused learning can take an idea a long way.</p>
          <Link to="/paths">
            Find a new path <ArrowUpRight className="icon" />
          </Link>
        </div>
      </aside>
      <div className="account-main">{children}</div>
    </div>
  );
}
export function Learning() {
  const { state } = useLearning();
  const paths = useApi(loadPaths, []);
  const roads = useApi(() => api.roadmaps(), []);
  const resources = useApi(() => api.resources(), []);
  const [tab, setTab] = useState('In progress');
  const active =
    roads.data?.filter(
      (r) => r.id && (state.roadmapKeys.includes(r.id) || state.completedTopics[r.id]?.length),
    ) || [];
  const roadmapData = useApi(
    () => Promise.all(active.map((r) => api.roadmap(r.type, r.slug))),
    [active.map((x) => x.id).join(',')],
  );
  const enrolled =
    paths.data?.filter(
      (c) => state.courseIds.includes(c.id) || active.some((r) => r.slug === c.slug),
    ) || [];
  const completed =
    roadmapData.data
      ?.filter((r) =>
        r.stages
          .flatMap((s) => s.topics)
          .every((t) => (state.completedTopics[r.id || ''] || []).includes(t.id)),
      )
      .map((r) => r.slug) || [];
  const visible = enrolled.filter((c) =>
    tab === 'Completed' ? completed.includes(c.slug) : !completed.includes(c.slug),
  );
  const last = state.activity.find((a) => a.action === 'lesson_opened');
  const recent = resources.data?.find((r) => r.id === last?.resource_id);
  return (
    <AccountLayout>
      <div className="account-intro">
        <span className="eyebrow">MY LEARNING</span>
        <h1>
          Your next step,
          <br />
          right where you left it.
        </h1>
        <p>A learning space that moves at your pace.</p>
      </div>
      <div className="stat-row">
        <div>
          <b>{enrolled.length - completed.length}</b>
          <span>Paths in progress</span>
        </div>
        <div>
          <b>{state.lessons.filter((x) => x.completed_at).length}</b>
          <span>Lessons completed</span>
        </div>
        <div>
          <b>{state.courseIds.length + state.resourceIds.length}</b>
          <span>Saved resources</span>
        </div>
      </div>
      {recent && (
        <div className="soft-banner">
          <div>
            <h3>{recent.title}</h3>
            <p>Return to your most recent lesson.</p>
          </div>
          <Button to={`/learn/${recent.slug}`}>Continue lesson</Button>
        </div>
      )}
      <div className="tabs" role="tablist">
        {['In progress', 'Completed'].map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={tab === t ? 'active' : ''}
            onClick={() => setTab(t)}
          >
            {t}{' '}
            <span>{t === 'Completed' ? completed.length : enrolled.length - completed.length}</span>
          </button>
        ))}
      </div>
      {paths.loading ? (
        <Loading />
      ) : paths.error ? (
        <ErrorState message={paths.error} />
      ) : visible.length ? (
        <div className="learning-cards">
          {visible.map((c) => {
            const r = roadmapData.data?.find((r) => r.slug === c.slug);
            const topics = r?.stages.flatMap((s) => s.topics) || [];
            const done = topics.filter((t) =>
              (state.completedTopics[r?.id || ''] || []).includes(t.id),
            ).length;
            const percent = topics.length ? Math.round((done / topics.length) * 100) : 0;
            const next = topics.find(
              (t) => !(state.completedTopics[r?.id || ''] || []).includes(t.id),
            );
            return (
              <article className="learning-card" key={c.id}>
                <Art title={c.title} category={c.category} />
                <div>
                  <span className="eyebrow muted">LEARNING PATH</span>
                  <h3>{c.title}</h3>
                  <p>
                    {next
                      ? `Next: ${next.title}`
                      : percent === 100
                        ? 'You completed this learning path.'
                        : 'Choose a lesson to get started.'}
                  </p>
                  <div className="progressbar">
                    <i style={{ width: `${percent}%` }} />
                  </div>
                  <div className="progress-label">
                    <span>
                      {done} of {topics.length} topics complete
                    </span>
                    <span>{percent}%</span>
                  </div>
                  <Button
                    to={
                      r
                        ? `/roadmap/${r.type}/${r.slug}`
                        : `/${c.kind === 'exam' ? 'exams' : 'skills'}/${c.slug}`
                    }
                  >
                    Continue learning
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title={
            tab === 'Completed'
              ? 'Your next milestone is ahead.'
              : 'Your learning journey starts here.'
          }
        />
      )}
    </AccountLayout>
  );
}
export function Saved() {
  const { state } = useLearning();
  const paths = useApi(loadPaths, []);
  const resources = useApi(() => api.resources(), []);
  const savedPaths = paths.data?.filter((c) => state.courseIds.includes(c.id)) || [];
  const savedResources = resources.data?.filter((r) => state.resourceIds.includes(r.id)) || [];
  return (
    <AccountLayout>
      <div className="account-intro">
        <span className="eyebrow">SAVED RESOURCES</span>
        <h1>
          For your
          <br />
          next curious moment.
        </h1>
        <p>A considered collection of things you want to come back to.</p>
      </div>
      <div className="search-results-heading">
        <h3>Your saved paths</h3>
        <span>{savedPaths.length} saved</span>
      </div>
      {paths.loading || resources.loading ? (
        <Loading />
      ) : paths.error || resources.error ? (
        <ErrorState message={paths.error || resources.error} />
      ) : (
        <>
          {savedPaths.length ? (
            <div className="course-grid two">
              {savedPaths.map((c) => (
                <PathCard key={c.id} item={c} />
              ))}
            </div>
          ) : (
            <EmptyState title="Make a little room for possibility." />
          )}
          {savedResources.length > 0 && (
            <section className="section">
              <h2>Saved videos and playlists</h2>
              <div className="playlist-grid mt-6">
                {savedResources.map((r) => (
                  <PlaylistCard key={r.id} resource={r} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </AccountLayout>
  );
}
export function Profile() {
  const { user, logout, updateProfile } = useAuth();
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  async function save(e: FormEvent) {
    e.preventDefault();
    try {
      await updateProfile(name || user!.full_name, 'en');
      setMessage('Your profile has been saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save profile');
    }
  }
  return (
    <AccountLayout>
      <div className="account-intro">
        <span className="eyebrow">PROFILE & PREFERENCES</span>
        <h1>
          Make learning
          <br />
          feel like you.
        </h1>
        <p>A few details to give your next step some direction.</p>
      </div>
      <form className="profile-form" onSubmit={save}>
        <img
          className="profile-cover"
          src="/design/design.png"
          alt="A creative learning workspace"
        />
        <div className="profile-top">
          <span className="avatar huge">{user?.full_name[0]}</span>
          <div>
            <h3>{user?.full_name}</h3>
            <span className="pill">Skillflix account</span>
          </div>
        </div>
        <div className="form-grid">
          <label>
            Your name
            <input
              value={name || user?.full_name || ''}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={120}
              autoComplete="name"
            />
          </label>
          <label>
            Email
            <input value={user?.email || ''} readOnly />
          </label>
        </div>
        <div className="form-footer">
          <span role="status">{message || 'Your account stays in sync across devices.'}</span>
          <button className="btn">
            Save changes <Check className="icon" />
          </button>
        </div>
      </form>
      <div className="button-row mt-6">
        {user?.role === 'SUPER_ADMIN' && (
          <Button secondary to="/admin/dashboard">
            Admin dashboard
          </Button>
        )}
        <button
          className="btn secondary"
          onClick={async () => {
            try {
              await logout();
              navigate('/');
            } catch {
              setMessage('Unable to log out. Try again.');
            }
          }}
        >
          Log out
        </button>
      </div>
    </AccountLayout>
  );
}
export function Onboarding() {
  const paths = useApi(loadPaths, []);
  const [selected, setSelected] = useState('');
  const [step, setStep] = useState(1);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [message, setMessage] = useState('');
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  async function finish() {
    try {
      if (user) await updateProfile(user.full_name, language);
      const c = paths.data?.find((c) => c.id === selected);
      if (c) navigate(`/${c.kind === 'exam' ? 'exams' : 'skills'}/${c.slug}`);
    } catch {
      setMessage('Unable to save preferences. Please try again.');
    }
  }
  return (
    <div className="onboarding container">
      <Link className="text-link skip-onboarding" to="/paths">
        Skip for now <ArrowRight className="icon" />
      </Link>
      <div className="step-dots">
        <span className={step === 1 ? 'active' : 'done'}>1</span>
        <i />
        <span className={step === 2 ? 'active' : ''}>2</span>
      </div>
      <span className="eyebrow">{step === 1 ? 'YOUR DIRECTION' : 'YOUR PREFERENCES'}</span>
      <h1>{step === 1 ? 'What is your next chapter?' : 'Make it your kind of learning.'}</h1>
      <p>
        {step === 1
          ? 'Choose one skill you would like to explore. You can change this later.'
          : 'Choose your preferred content language. You can still explore every path.'}
      </p>
      {step === 1 ? (
        <>
          {paths.loading ? (
            <Loading />
          ) : paths.error ? (
            <ErrorState message={paths.error} />
          ) : (
            <div className="goal-grid">
              {paths.data?.map((c) => (
                <button
                  key={c.id}
                  className={`goal-option ${selected === c.id ? 'selected' : ''}`}
                  aria-pressed={selected === c.id}
                  onClick={() => setSelected(c.id)}
                >
                  <span
                    className="goal-icon violet"
                    style={{
                      backgroundImage: `url(/design/${c.category === 'Design' ? 'design' : 'code'}.png)`,
                    }}
                  />
                  <b>{c.title}</b>
                  <span className="radio-dot" />
                </button>
              ))}
            </div>
          )}
          <button className="btn" disabled={!selected} onClick={() => setStep(2)}>
            Continue <ArrowRight className="icon" />
          </button>
        </>
      ) : (
        <>
          <img
            className="language-cover"
            src="/design/design.png"
            alt="Your next learning chapter"
          />
          <div className="language-options">
            {(['en', 'hi'] as const).map((l) => (
              <button
                key={l}
                className={`goal-option ${language === l ? 'selected' : ''}`}
                aria-pressed={language === l}
                onClick={() => setLanguage(l)}
              >
                <b>{l === 'en' ? 'English' : 'Hindi'}</b>
                <span>Educational content</span>
                <span className="radio-dot" />
              </button>
            ))}
          </div>
          <div className="button-row centered">
            <button className="btn secondary" onClick={() => setStep(1)}>
              Back
            </button>
            <button className="btn" onClick={() => void finish()}>
              Show my learning path <ArrowRight className="icon" />
            </button>
          </div>
        </>
      )}
      {message && <p role="alert">{message}</p>}
      <p className="smallprint">A small first step is a good first step.</p>
    </div>
  );
}
