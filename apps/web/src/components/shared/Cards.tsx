import { ArrowUpRight, Bookmark, BookOpen, Clock3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CatalogItem, Resource } from '../../types';
import { useLearning } from '../../context/LearningState';
import { useLanguage } from '../../context/Language';
export function CatalogCard({ item }: { item: CatalogItem }) {
  return (
    <Link
      className="card group block h-full"
      to={`/${item.kind === 'exam' ? 'exams' : 'skills'}/${item.slug}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="eyebrow">{item.category}</span>
        <ArrowUpRight
          size={18}
          className="text-blue transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
        />
      </div>
      <h3 className="mt-6 text-2xl">{item.title}</h3>
      <p className="mt-3 min-h-12 text-sm leading-6 text-muted">{item.summary}</p>
      <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-4 text-xs text-muted">
        <span>{item.level}</span>
        {item.duration && (
          <span className="flex items-center gap-1">
            <Clock3 size={14} />
            {item.duration}
          </span>
        )}
        {item.kind === 'skill' && (
          <span className="flex items-center gap-1">
            <BookOpen size={14} />
            {item.modules.length} topics
          </span>
        )}
      </div>
    </Link>
  );
}
export function ResourceCard({ resource }: { resource: Resource }) {
  const { t } = useLanguage();
  const { isResourceSaved, toggleResource } = useLearning();
  const saved = isResourceSaved(resource.id);
  return (
    <article className="card flex h-full flex-col overflow-hidden p-0">
      {resource.thumbnail_url && (
        <img
          src={
            resource.thumbnail_url.startsWith('/api/')
              ? `${import.meta.env.VITE_API_URL || ''}${resource.thumbnail_url}`
              : resource.thumbnail_url
          }
          alt=""
          loading="lazy"
          className="aspect-video w-full object-cover"
        />
      )}
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <span className="eyebrow">
            {resource.kind} · {resource.language}
          </span>
          <button
            type="button"
            aria-label={saved ? `Remove ${resource.title} from saved` : `Save ${resource.title}`}
            aria-pressed={saved}
            onClick={() => toggleResource(resource.id)}
            className="rounded-md p-2 text-blue hover:bg-softblue"
          >
            <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>
        <h3 className="mt-4 text-2xl">{resource.title}</h3>
        <p className="mt-2 text-sm text-muted">By {resource.creator}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
          <span className="rounded-full bg-paper px-3 py-1">{resource.topic}</span>
          <span className="rounded-full bg-paper px-3 py-1">{resource.level}</span>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 pt-7">
          <span className="text-xs text-muted">{resource.review_status}</span>
          <Link
            className="inline-flex items-center gap-1 text-sm font-semibold text-blue underline-offset-4 hover:underline"
            to={`/learn/${resource.slug}`}
          >
            {t('watch')} <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
    </article>
  );
}
