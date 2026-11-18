import { ExternalLink } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ResourceCard } from '../components/shared/Cards';
import { Empty, ErrorState, Loading, NotFound } from '../components/shared/States';
import { roadmaps } from '../data/roadmaps';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
export function TeacherProfile() {
  const { slug = '' } = useParams();
  const educator = useApi(() => api.educator(slug), [slug]);
  const resources = useApi(() => api.resources(), []);
  if (educator.loading)
    return (
      <main className="container-site">
        <Loading />
      </main>
    );
  if (educator.error)
    return educator.error === 'Not found' ? (
      <NotFound />
    ) : (
      <main className="container-site py-12">
        <ErrorState message={educator.error} />
      </main>
    );
  const e = educator.data;
  if (!e) return <NotFound />;
  const relatedRoadmaps = roadmaps.filter((r) => e.path_slugs.includes(r.slug));
  const relatedResources = resources.data?.filter((r) => r.educator_slug === slug) || [];
  return (
    <main className="container-site space-y-12 py-12">
      <Link className="text-sm font-semibold text-blue" to="/teachers">
        ← Back to directory
      </Link>
      <header className="border-b border-border pb-10">
        <p className="eyebrow">
          {e.kind} / {e.focus}
        </p>
        <h1 className="mt-4 text-5xl sm:text-6xl">{e.name}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">{e.description}</p>
        {e.channel_url && (
          <a
            className="button-outline mt-7"
            href={e.channel_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open YouTube channel <ExternalLink size={16} />
          </a>
        )}
      </header>
      <section className="grid gap-8 md:grid-cols-3">
        <div>
          <p className="eyebrow">Subjects</p>
          <p className="mt-3 text-sm text-muted">{e.subjects.join(', ')}</p>
        </div>
        <div>
          <p className="eyebrow">Languages</p>
          <p className="mt-3 text-sm text-muted">{e.languages.join(', ')}</p>
        </div>
        <div>
          <p className="eyebrow">Learning levels</p>
          <p className="mt-3 text-sm text-muted">{e.levels.join(', ')}</p>
        </div>
      </section>
      <section className="border-t border-border pt-10">
        <p className="eyebrow">Keep learning</p>
        <h2 className="section-title mt-3">Related roadmaps</h2>
        {relatedRoadmaps.length ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {relatedRoadmaps.map((r) => (
              <Link to={`/roadmap/${r.type}/${r.slug}`} className="card block" key={r.slug}>
                <p className="eyebrow">{r.type}</p>
                <h3 className="mt-3 text-2xl">{r.title}</h3>
                <p className="mt-2 text-sm text-muted">{r.stages.length} stages</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-sm text-muted">No full roadmap is linked yet.</p>
        )}
      </section>
      <section className="border-t border-border pt-10">
        <p className="eyebrow">From this publisher</p>
        <h2 className="section-title mt-3">Related resources</h2>
        {resources.loading ? (
          <Loading />
        ) : resources.error ? (
          <ErrorState message={resources.error} />
        ) : relatedResources.length ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {relatedResources.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <Empty message="No resources linked to this publisher yet." />
          </div>
        )}
      </section>
    </main>
  );
}
