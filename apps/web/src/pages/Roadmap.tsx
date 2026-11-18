import { Link, useParams } from 'react-router-dom';
import { NextTopicCard, RoadmapHeader, RoadmapProgress } from '../components/roadmap/RoadmapParts';
import { ErrorState, Loading, NotFound } from '../components/shared/States';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import { RoadmapMap } from '../components/roadmap/RoadmapMap';
export function RoadmapPage() {
  const { type = '', slug = '' } = useParams();
  const result = useApi(() => api.roadmap(type as 'exam' | 'skill', slug), [type, slug]);
  const roadmap = result.data;
  const resources = useApi(() => api.resources(), []);
  if (result.loading)
    return (
      <main className="container-site">
        <Loading />
      </main>
    );
  if (result.error)
    return result.error === 'Not found' ? (
      <NotFound />
    ) : (
      <main className="container-site py-12">
        <ErrorState message={result.error} />
      </main>
    );
  if (!roadmap) return <NotFound />;
  return (
    <main className="container-site py-12">
      <Link
        className="text-sm font-semibold text-blue hover:underline"
        to={`/${type === 'exam' ? 'exams' : 'skills'}/${slug}`}
      >
        ← Back to {type === 'exam' ? 'exam' : 'skill'} overview
      </Link>
      <div className="mt-10">
        <RoadmapHeader roadmap={roadmap} />
      </div>
      <div className="mt-10 grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          {resources.loading ? (
            <Loading />
          ) : resources.error ? (
            <ErrorState message={resources.error} />
          ) : (
            <RoadmapMap roadmap={roadmap} resources={resources.data || []} />
          )}
        </div>
        <div className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <RoadmapProgress roadmap={roadmap} />
          <NextTopicCard roadmap={roadmap} />
        </div>
      </div>
    </main>
  );
}
