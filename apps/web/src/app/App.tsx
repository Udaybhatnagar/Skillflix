import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { NotFound } from '../components/shared/States';
import { LearningProvider } from '../context/LearningState';
import { AuthProvider } from '../context/Auth';
import { LanguageProvider } from '../context/Language';
import { AuthCallback, ForgotPassword } from '../components/auth/AuthForm';
import { AuthDialog } from '../components/auth/AuthDialog';
import { useAuth } from '../context/Auth';
import { LoginPage, SignupPage } from '../pages/AuthPages';
import { Profile, Saved, Onboarding } from '../design/Account';
import { FigmaLearning as MyLearning } from '../design/FigmaLearning';
import { Contact, Privacy, Terms } from '../pages/Info';
const Player = lazy(() => import('../pages/Player').then((m) => ({ default: m.Player })));
const AdminApp = lazy(() => import('../admin/AdminApp').then((m) => ({ default: m.AdminApp })));
import { About } from '../pages/About';
import { Paths as Catalog, Paths as Courses } from '../design/Discovery';

import { PathDetail as Detail, PlaylistDetail } from '../design/PathDetail';

import { RoadmapPage } from '../pages/Roadmap';
import { ReferenceSearch as Search } from '../design/Search';
import { ConceptCategories as Categories, ConceptPlaylists as Resources } from '../design/Concept';
import { Teachers, TeacherProfile } from '../design/Teachers';
import { FigmaHome } from '../design/FigmaHome';

const titles: Record<string, string> = {
  '/': 'Home',
  '/exams': 'Competitive Exams',
  '/courses': 'Explore Courses',
  '/paths': 'Learning paths',
  '/categories': 'Explore categories',
  '/playlists': 'Curated playlists',
  '/saved': 'Saved resources',
  '/onboarding': 'Your learning goal',
  '/skills': 'Professional Skills',
  '/resources': 'Resources',
  '/teachers': 'Educators',
  '/my-learning': 'My Learning',
  '/search': 'Search',
  '/about': 'About',
  '/login': 'Log in',
  '/signup': 'Sign up',
  '/forgot-password': 'Reset password',
  '/profile': 'Profile',
  '/contact': 'Contact',
  '/privacy': 'Privacy Policy',
  '/terms': 'Terms of Service',
};
function PageMeta() {
  const { pathname } = useLocation();
  useEffect(() => {
    const title =
      titles[pathname] ||
      (pathname.startsWith('/admin/')
        ? 'Administration'
        : pathname.startsWith('/category/')
          ? 'Explore category'
          : pathname.startsWith('/playlist/')
            ? 'Curated playlist'
            : pathname.startsWith('/learn/')
              ? 'Learning player'
              : pathname.startsWith('/roadmap/')
                ? 'Learning Roadmap'
                : pathname.startsWith('/teachers/')
                  ? 'Educator Profile'
                  : pathname.startsWith('/exams/')
                    ? 'Exam Guide'
                    : pathname.startsWith('/skills/')
                      ? 'Skill Path'
                      : 'Page not found');
    document.title = `${title} | Skillflix`;
    const privateRoute =
      /^\/(admin|my-learning|profile|saved|learn|login|signup|auth|forgot-password)(\/|$)/.test(
        pathname,
      );
    const setMeta = (name: string, content: string) => {
      let tag = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.name = name;
        document.head.appendChild(tag);
      }
      tag.content = content;
    };
    setMeta('robots', privateRoute ? 'noindex,nofollow' : 'index,follow');
    setMeta(
      'description',
      `${title} on Skillflix. Discover structured learning paths and curated educational resources.`,
    );
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = `${location.origin}${pathname}`;
    let og = document.head.querySelector<HTMLMetaElement>('meta[property="og:title"]');
    if (!og) {
      og = document.createElement('meta');
      og.setAttribute('property', 'og:title');
      document.head.appendChild(og);
    }
    og.content = document.title;
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
function GlobalAuthDialog() {
  const { dialogOpen, closeDialog } = useAuth();
  return <AuthDialog open={dialogOpen} onClose={closeDialog} />;
}
export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <LearningProvider>
            <PageMeta />
            <GlobalAuthDialog />
            <Routes>
              <Route
                path="/admin/*"
                element={
                  <Suspense
                    fallback={<main className="container-site py-12">Loading administration…</main>}
                  >
                    <AdminApp />
                  </Suspense>
                }
              />
              <Route
                path="*"
                element={
                  <Layout>
                    <Routes>
                      <Route path="/" element={<FigmaHome />} />
                      <Route path="/exams" element={<Catalog kind="exam" />} />
                      <Route path="/courses" element={<Courses />} />
                      <Route path="/paths" element={<Courses />} />
                      <Route path="/categories" element={<Categories />} />
                      <Route path="/category/:id" element={<Courses />} />
                      <Route path="/playlists" element={<Resources />} />
                      <Route path="/playlist/:slug" element={<PlaylistDetail />} />
                      <Route path="/saved" element={<Saved />} />
                      <Route path="/onboarding" element={<Onboarding />} />
                      <Route path="/signin" element={<LoginPage />} />
                      <Route path="/exams/:slug" element={<Detail kind="exam" />} />
                      <Route path="/skills" element={<Catalog kind="skill" />} />
                      <Route path="/skills/:slug" element={<Detail kind="skill" />} />
                      <Route path="/roadmap/:type/:slug" element={<RoadmapPage />} />
                      <Route path="/resources" element={<Resources all />} />
                      <Route path="/teachers" element={<Teachers />} />
                      <Route path="/teachers/:slug" element={<TeacherProfile />} />
                      <Route path="/my-learning" element={<MyLearning />} />
                      <Route path="/search" element={<Search />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="/terms" element={<Terms />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/signup" element={<SignupPage />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/auth/callback" element={<AuthCallback />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route
                        path="/learn/:slug"
                        element={
                          <Suspense
                            fallback={<main className="container-site py-12">Loading lesson…</main>}
                          >
                            <Player />
                          </Suspense>
                        }
                      />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Layout>
                }
              />
            </Routes>
          </LearningProvider>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
