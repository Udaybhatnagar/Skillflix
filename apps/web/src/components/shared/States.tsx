import { Link } from 'react-router-dom';
export function Loading() {
  return (
    <div role="status" className="py-16 text-center text-muted">
      Loading content…
    </div>
  );
}
export function ErrorState({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-xl border border-border bg-white p-8 text-center">
      <p>{message}</p>
      <button className="button-outline mt-4" onClick={() => location.reload()}>
        Try again
      </button>
    </div>
  );
}
export function Empty({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-border bg-white p-8 text-center text-muted">
      {message}
    </div>
  );
}
export function NotFound() {
  return (
    <main className="container-site py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 text-5xl">Page not found</h1>
      <p className="mt-4 text-muted">This page may have moved or does not exist.</p>
      <Link to="/" className="button-primary mt-8">
        Return home
      </Link>
    </main>
  );
}
