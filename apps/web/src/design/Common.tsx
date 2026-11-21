import {
  ArrowUpRight,
  ArrowRight,
  Search,
  Bookmark,
  Play,
  Check,
  Layers,
  Globe,
  Clock,
  Code,
  PenTool,
  Sparkles,
  Menu,
  X,
  BookOpen,
  User,
  Home,
  LogOut,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, type ReactNode, type FormEvent } from 'react';
import type { CatalogItem, Resource } from '../types';
import { useLearning } from '../context/LearningState';
import { figmaArtwork } from './FigmaAssets';
export {
  ArrowUpRight,
  ArrowRight,
  Search,
  Bookmark,
  Play,
  Check,
  Layers,
  Globe,
  Clock,
  Code,
  PenTool,
  Sparkles,
  Menu,
  X,
  BookOpen,
  User,
  Home,
  LogOut,
  ChevronDown,
  ChevronRight,
};
export const pathUrl = (c: CatalogItem) => `/${c.kind === 'exam' ? 'exams' : 'skills'}/${c.slug}`;
export function themeFor(category: string) {
  const c = category.toLowerCase();
  return /design/.test(c)
    ? 'violet'
    : /tech|develop|program/.test(c)
      ? 'cyan'
      : /market|business|finance/.test(c)
        ? 'pink'
        : 'yellow';
}
export function imageFor(category: string, title = '') {
  return figmaArtwork(title, category);
}
export function Art({
  title,
  category,
  large = false,
  src,
}: {
  title: string;
  category: string;
  large?: boolean;
  src?: string | null;
}) {
  return (
    <div className={`course-art media-art ${themeFor(category)} ${large ? 'large' : ''}`}>
      <img
        src={
          src
            ? src.startsWith('/api/')
              ? `${import.meta.env.VITE_API_URL || ''}${src}`
              : src
            : imageFor(category, title)
        }
        alt={`${title} learning illustration`}
        loading="lazy"
      />
      <span className="media-caption">{title}</span>
      <span className="media-badge">
        <Play className="icon" /> LEARNING PATH
      </span>
    </div>
  );
}
export function Button({
  to,
  children,
  secondary = false,
}: {
  to: string;
  children: ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link className={`btn ${secondary ? 'secondary' : ''}`} to={to}>
      {children}
      <ArrowRight className="icon" />
    </Link>
  );
}
export function Intro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: ReactNode;
  description: string;
}) {
  return (
    <section className="page-intro">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  );
}
export function SectionHead({
  eyebrow,
  title,
  to,
  label,
}: {
  eyebrow: string;
  title: string;
  to?: string;
  label?: string;
}) {
  return (
    <div className="section-head">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {to && (
        <Link className="text-link" to={to}>
          {label}
          <ArrowUpRight className="icon" />
        </Link>
      )}
    </div>
  );
}
export function SearchForm({ initial = '', hero = false }: { initial?: string; hero?: boolean }) {
  const [query, setQuery] = useState(initial);
  useEffect(() => setQuery(initial), [initial]);
  const navigate = useNavigate();
  function submit(e: FormEvent) {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  }
  return (
    <form onSubmit={submit} className={`search-form ${hero ? 'hero-search' : ''}`} role="search">
      <Search className="icon" />
      <input
        aria-label="Search learning resources"
        placeholder="What do you want to learn?"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button className="btn">
        Search
        <ArrowUpRight className="icon" />
      </button>
    </form>
  );
}
export function PathCard({ item }: { item: CatalogItem }) {
  const learning = useLearning();
  const saved = learning.isCourseSaved(item.id);
  return (
    <article className="course-card">
      <Link className="art-link" to={pathUrl(item)} aria-label={`Explore ${item.title}`}>
        <Art title={item.title} category={item.category} src={item.thumbnail_url} />
      </Link>
      <div className="course-copy">
        <div className="eyebrow muted">
          {item.kind === 'exam' ? 'EXAM PREPARATION' : 'LEARNING PATH'} <span>·</span>{' '}
          {item.level?.toUpperCase()}
        </div>
        <Link to={pathUrl(item)}>
          <h3>{item.title}</h3>
        </Link>
        <p>{item.summary}</p>
        <div className="card-meta">
          <span>
            <Layers className="icon" />
            {item.modules.length} modules
          </span>
          <span>
            <Clock className="icon" />
            {item.duration || 'Self-paced'}
          </span>
        </div>
        <div className="card-bottom">
          <Link to={pathUrl(item)}>
            Explore path <ArrowUpRight className="icon" />
          </Link>
          <button
            className={`save-btn ${saved ? 'is-saved' : ''}`}
            aria-label={`${saved ? 'Unsave' : 'Save'} ${item.title}`}
            aria-pressed={saved}
            onClick={() => learning.toggleCourse(item.id)}
          >
            <Bookmark className="icon" />
          </button>
        </div>
      </div>
    </article>
  );
}
export function PlaylistCard({ resource }: { resource: Resource }) {
  const { isResourceSaved, toggleResource } = useLearning();
  const saved = isResourceSaved(resource.id);
  return (
    <article className="course-card playlist-card">
      <Link
        className="art-link"
        to={resource.kind === 'Playlist' ? `/playlist/${resource.slug}` : `/learn/${resource.slug}`}
      >
        <div className="resource-thumbnail">
          <img
            src={
              resource.thumbnail_url
                ? resource.thumbnail_url.startsWith('/api/')
                  ? `${import.meta.env.VITE_API_URL || ''}${resource.thumbnail_url}`
                  : resource.thumbnail_url
                : resource.video_id
                  ? `https://i.ytimg.com/vi/${resource.video_id}/hqdefault.jpg`
                  : imageFor(resource.category)
            }
            alt={resource.title}
            loading="lazy"
          />
          <span>
            <Play className="icon" />
          </span>
        </div>
      </Link>
      <div className="course-copy">
        <span className="eyebrow muted">
          {resource.kind.toUpperCase()} · {resource.language}
        </span>
        <h3>
          <Link
            to={
              resource.kind === 'Playlist'
                ? `/playlist/${resource.slug}`
                : `/learn/${resource.slug}`
            }
          >
            {resource.title}
          </Link>
        </h3>
        <p>By {resource.creator}</p>
        <div className="card-meta">
          <span>
            <Globe className="icon" />
            {resource.language}
          </span>
          <span>{resource.level}</span>
        </div>
        <div className="card-bottom">
          <Link
            to={
              resource.kind === 'Playlist'
                ? `/playlist/${resource.slug}`
                : `/learn/${resource.slug}`
            }
          >
            {resource.kind === 'Playlist' ? 'Explore playlist' : 'Watch lesson'}
            <ArrowUpRight className="icon" />
          </Link>
          <button
            className={`save-btn ${saved ? 'is-saved' : ''}`}
            aria-label={`${saved ? 'Unsave' : 'Save'} ${resource.title}`}
            aria-pressed={saved}
            onClick={() => toggleResource(resource.id)}
          >
            <Bookmark className="icon" />
          </button>
        </div>
      </div>
    </article>
  );
}
export function EmptyState({
  title = 'Your next step starts here.',
  description = 'Explore a path and save it for your next learning session.',
  to = '/paths',
  label = 'Explore learning paths',
}: {
  title?: string;
  description?: string;
  to?: string;
  label?: string;
}) {
  return (
    <div className="empty-state">
      <span className="figma-empty-icon">
        <Search className="icon" />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      <Button to={to}>{label}</Button>
    </div>
  );
}
export function Breadcrumb({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <Link to="/">Home</Link>
      {items.map((x, i) => (
        <span className="inline-flex items-center gap-2" key={i}>
          <ChevronRight className="icon" />
          {x.to ? <Link to={x.to}>{x.label}</Link> : <span aria-current="page">{x.label}</span>}
        </span>
      ))}
    </nav>
  );
}
