import { CatalogCard } from '../components/shared/Cards';
import { ErrorState, Loading } from '../components/shared/States';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
export function Courses() {
  const result = useApi(
    async () => [...(await api.catalog('exam')), ...(await api.catalog('skill'))],
    [],
  );
  return (
    <main className="container-site py-14">
      <p className="eyebrow">Explore</p>
      <h1 className="mt-4 text-5xl sm:text-6xl">Learning paths for every goal.</h1>
      <p className="mt-5 max-w-2xl text-muted">
        Browse published exams and professional skills, then open a course to follow its roadmap.
      </p>
      {result.loading ? (
        <Loading />
      ) : result.error ? (
        <ErrorState message={result.error} />
      ) : (
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {result.data?.map((item) => (
            <CatalogCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </main>
  );
}
