import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/Auth';
import { useLearning } from '../context/LearningState';
import { ErrorState, Loading } from '../components/shared/States';
import { categories, inCategory } from './Discovery';
import {
  Art,
  Button,
  PathCard,
  SectionHead,
  Layers,
  Play,
  Bookmark,
  Clock,
  Check,
  Sparkles,
  ArrowRight,
  pathUrl,
} from './Common';
import { figmaAssets } from './FigmaAssets';

export function FigmaHome() {
  const paths = useApi(
    async () => [...(await api.catalog('skill')), ...(await api.catalog('exam'))],
    [],
  );
  const resources = useApi(() => api.resources(), []);
  const { user } = useAuth();
  const { state } = useLearning();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const saved = paths.data?.filter((c) => state.courseIds.includes(c.id)) || [];
  const featured = resources.data?.find((r) => /react/i.test(r.title));
  const previewUrl = featured ? `/learn/${featured.slug}` : '/search?q=React';
  const topCategories = [
    'development',
    'design',
    'ai',
    'business',
    'marketing',
    'productivity',
  ].map((id) => categories.find((c) => c.id === id)!);
  return (
    <div className="figma-home">
      <section className="figma-hero-band">
        <div className="container figma-hero">
          <div className="figma-hero-copy">
            <span className="figma-kicker">100% FREE · CURATED · STRUCTURED</span>
            <h1>
              <span className="desktop-headline">Learn Any Skill for Free.</span>
              <span className="mobile-headline">Learn any skill</span>
              <strong className="desktop-headline">The Smart Way.</strong>
              <strong className="mobile-headline">for free.</strong>
            </h1>
            <p className="desktop-headline">
              Find a curated YouTube playlist or follow a step-by-step roadmap.
              <br />
              Learn at your pace and see what comes next.
            </p>
            <p className="mobile-headline">Curated courses and clear roadmaps.</p>
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
                  Best Free
                  <br />
                  YouTube Content
                </b>
              </span>
            </div>
            <div className="button-row">
              <Button to="/paths">Explore courses</Button>
              <Button secondary to="/categories">
                Explore Categories
              </Button>
            </div>
            <p className="figma-hero-caption">
              <span className="figma-avatar-stack" aria-hidden="true">
                <i>A</i>
                <i>C</i>
                <i>R</i>
                <i>S</i>
              </span>
              Free, structured learning at your own pace.
            </p>
          </div>
          <div className="figma-course-preview" aria-label="Course preview">
            <span className="figma-preview-sticker">
              <Sparkles className="icon" />
              No Ads
              <br />
              Less distraction
            </span>
            <div className="figma-preview-header">
              <span className="figma-avatar">C</span>
              <div>
                <b>{featured?.title || 'Complete React Course for Beginners'}</b>
                <small>{featured?.creator || 'CodeWithHarry'} · Course preview</small>
              </div>
              <Link className="btn small" to={previewUrl}>
                Preview →
              </Link>
            </div>
            <div className="figma-preview-content">
              <ol>
                {[
                  'Introduction',
                  'React Basics',
                  'Components',
                  'Props & State',
                  'React Hooks',
                  'Projects',
                ].map((x, i) => (
                  <li key={x} className={i === 1 ? 'active' : ''}>
                    {i + 1}. {x}
                  </li>
                ))}
              </ol>
              <div>
                <Link className="figma-preview-image" to={previewUrl}>
                  <img src={figmaAssets.react} alt="React course preview" />
                  <strong>
                    React<small>in 2 hours</small>
                  </strong>
                  <span className="figma-video-controls">
                    <Play className="icon" /> Course preview <span>CC ⋮</span>
                  </span>
                </Link>
                <div className="figma-preview-progress">
                  <b>Course preview</b>
                  <p>Explore the lessons before you start.</p>
                  <Link to={user ? '/my-learning' : '/login'}>
                    {user ? 'View your learning progress.' : 'Sign in to save your progress.'}
                  </Link>
                </div>
              </div>
            </div>
            <span className="figma-preview-bottom">
              ♧ Learn Faster
              <br />
              <b>Remember Better</b>
            </span>
          </div>
        </div>
      </section>
      <div className="container figma-home-content">
        <section className="figma-section figma-top-categories">
          <SectionHead
            eyebrow=""
            title="Explore Top Categories"
            to="/categories"
            label="View all categories"
          />
          <div className="concept-category-strip">
            {topCategories.map((c) => (
              <Link className={`concept-category ${c.theme}`} key={c.id} to={`/category/${c.id}`}>
                <span className="category-icon">
                  <c.icon className="icon" />
                </span>
                <div>
                  <h3>
                    {c.id === 'development' ? 'Programming' : c.id === 'ai' ? 'AI / ML' : c.name}
                  </h3>
                  <p>
                    {paths.data?.filter((x) => inCategory(x.category, x.kind, c.id)).length || 0}{' '}
                    learning paths
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
        <section className="figma-section">
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
        <section className="figma-section figma-continue">
          {user && saved.length ? (
            <>
              <SectionHead
                eyebrow=""
                title="Continue learning"
                to="/my-learning"
                label="View all"
              />
              <div className="concept-continue-grid">
                {saved.slice(0, 4).map((c) => (
                  <Link className="concept-continue" key={c.id} to={pathUrl(c)}>
                    <Art title={c.title} category={c.category} src={c.thumbnail_url} />
                    <div>
                      <h3>{c.title}</h3>
                      <p>Resume your learning</p>
                      <span>
                        Continue <ArrowRight className="icon" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="figma-resume-banner">
              <div>
                <h2>Pick up where you left off</h2>
                <p>
                  {user
                    ? 'Save a learning path or playlist to see it here.'
                    : 'Sign in to sync learning progress and keep your saved playlists together.'}
                </p>
              </div>
              <Button to={user ? '/paths' : '/login'}>{user ? 'Explore paths' : 'Sign in'}</Button>
            </div>
          )}
        </section>
        <section className="figma-section figma-home-desktop">
          <SectionHead eyebrow="" title="Why Learners Choose Skillflix" />
          <div className="concept-reasons">
            {[
              [Layers, 'Handpicked Content', 'Curated YouTube playlists'],
              [Sparkles, 'Structured Roadmaps', 'Step-by-step learning paths'],
              [Clock, 'Track Your Progress', 'See completed lessons'],
              [Bookmark, 'Learn at Your Pace', 'Build your learning routine'],
              [Check, 'Free to Get Started', 'Start with free resources'],
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
        <section className="figma-section figma-home-desktop">
          <SectionHead eyebrow="" title="Learning Goals" />
          <div className="figma-goals">
            {[
              [
                'Build a portfolio project',
                'Follow a sequence from fundamentals to a project you can show.',
                'Web development',
                'development',
              ],
              [
                'Prepare for a career switch',
                'Use a roadmap to plan what to learn next and what to practice.',
                'Data analysis',
                'data-science',
              ],
              [
                'Learn around your schedule',
                'Pick up the next lesson whenever you have a few minutes to learn.',
                'UI/UX design',
                'design',
              ],
            ].map(([title, copy, label, id]) => (
              <Link key={id} to={`/category/${id}`}>
                <h3>{title}</h3>
                <p>{copy}</p>
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </section>
        <section className="concept-cta figma-home-desktop">
          <div>
            <h2>Ready to start your learning journey?</h2>
            <p>Explore free resources and learn at your own pace.</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate(
                user ? '/paths' : `/signup${email ? `?email=${encodeURIComponent(email)}` : ''}`,
              );
            }}
          >
            <input
              type="email"
              aria-label="Your email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="btn">Get Started Free</button>
          </form>
        </section>
      </div>
    </div>
  );
}
