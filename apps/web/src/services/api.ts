import type { CatalogItem, Educator, Resource, SearchResults } from '../types';
import type { Roadmap } from '../types/roadmap';
export interface User {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: 'USER' | 'SUPER_ADMIN';
  preferred_language: 'en' | 'hi';
  status: string;
  created_at: string;
  verified_at: string | null;
}
export class ApiError extends Error {
  constructor(
    public status: number,
    message?: string,
  ) {
    super(message || (status === 404 ? 'Not found' : 'Unable to load content. Please try again.'));
  }
}
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const base = import.meta.env.VITE_API_URL || '';
  const response = await fetch(`${base}/api${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      ...(init?.body && !(init.body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    let message: string | undefined;
    try {
      message = (await response.json()).error;
    } catch {}
    throw new ApiError(response.status, message);
  }
  return response.json() as Promise<T>;
}
const params = (q = '', category = '') => new URLSearchParams({ q, category }).toString();
export const api = {
  catalog: (kind: 'exam' | 'skill', q = '', category = '') =>
    request<CatalogItem[]>(`/catalog/${kind}?${params(q, category)}`),
  detail: (kind: 'exam' | 'skill', slug: string) =>
    request<CatalogItem>(`/catalog/${kind}/${encodeURIComponent(slug)}`),
  resources: (q = '', category = '') => request<Resource[]>(`/resources?${params(q, category)}`),
  educators: () => request<Educator[]>('/educators'),
  educator: (slug: string) => request<Educator>(`/educators/${encodeURIComponent(slug)}`),
  search: (q: string, category = '', language = '', sort = 'title') =>
    request<SearchResults>(`/search?${new URLSearchParams({ q, category, language, sort })}`),
  roadmap: (kind: 'exam' | 'skill', slug: string) =>
    request<Roadmap>(`/roadmaps/${kind}/${encodeURIComponent(slug)}`),
  roadmaps: () => request<Roadmap[]>('/roadmaps'),
  resource: (slug: string) =>
    request<
      Resource & {
        video_id: string | null;
        playlist_id: string | null;
        description: string;
        lessons: Resource[];
      }
    >(`/resources/${encodeURIComponent(slug)}`),
  auth: {
    me: () =>
      request<{ user: User | null; googleEnabled: boolean; emailDeliveryEnabled: boolean }>(
        '/auth/me',
      ),
    login: (email: string, password: string) =>
      request<{ user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    signup: (fullName: string, email: string, password: string, confirmPassword: string) =>
      request<{ user: User }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ fullName, email, password, confirmPassword }),
      }),
    google: (credential: string) =>
      request<{ user: User }>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential }),
      }),
    logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
    profile: (fullName: string, preferredLanguage: 'en' | 'hi') =>
      request<{ user: User }>('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({ fullName, preferredLanguage }),
      }),
  },
};
