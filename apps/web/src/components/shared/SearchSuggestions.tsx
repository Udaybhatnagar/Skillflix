import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
export function SearchSuggestions({ query, onSelect }: { query: string; onSelect: () => void }) {
  const [items, setItems] = useState<{ title: string; path: string; kind: string }[]>([]);
  const [status, setStatus] = useState('');
  useEffect(() => {
    let active = true;
    setItems([]);
    if (query.trim().length < 2) {
      setStatus('');
      return;
    }
    setStatus('Searching…');
    const timer = setTimeout(() => {
      api
        .search(query.trim())
        .then((result) => {
          if (!active) return;
          setItems(
            [
              ...result.catalog.map((x) => ({
                title: x.title,
                path: `/${x.kind === 'exam' ? 'exams' : 'skills'}/${x.slug}`,
                kind: 'Learning path',
              })),
              ...(result.educators || []).map((x) => ({
                title: x.name,
                path: `/teachers/${x.slug}`,
                kind: 'Teacher',
              })),
              ...result.resources.map((x) => ({
                title: x.title,
                path: `/learn/${x.slug}`,
                kind: x.kind,
              })),
            ].slice(0, 5),
          );
          setStatus('');
        })
        .catch(() => {
          if (active) setStatus('Press Enter to search all content');
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);
  if (query.trim().length < 2) return null;
  return (
    <div className="search-suggestions absolute inset-x-0 top-full z-50 mt-3 overflow-hidden rounded-2xl border border-border bg-white p-2 text-ink shadow-lg">
      <p role="status" className="px-3 py-2 text-xs text-muted">
        {status || (!items.length ? 'No matching suggestions' : 'Suggested results')}
      </p>
      {items.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          onClick={onSelect}
          className="block rounded-xl px-3 py-3 hover:bg-softblue"
        >
          <span className="block text-sm font-semibold">{item.title}</span>
          <span className="text-xs text-muted">{item.kind}</span>
        </Link>
      ))}
      <Link
        onClick={onSelect}
        className="block rounded-xl bg-paper px-3 py-3 text-sm font-semibold text-blue"
        to={`/search?q=${encodeURIComponent(query.trim())}`}
      >
        View all results
      </Link>
    </div>
  );
}
