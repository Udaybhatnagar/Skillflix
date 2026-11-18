export interface CatalogItem {
  thumbnail_url?: string | null;
  id: string;
  kind: 'exam' | 'skill';
  slug: string;
  title: string;
  category: string;
  level: string | null;
  duration: string | null;
  summary: string;
  overview: string;
  outcomes: string[];
  modules: string[];
  guidance: string;
}
export interface Resource {
  id: string;
  slug: string;
  title: string;
  kind: 'Video' | 'Playlist';
  video_id?: string | null;
  description?: string;
  category: string;
  language: string;
  creator: string;
  url: string;
  related_slug: string | null;
  review_status: string;
  topic: string;
  level: string;
  educator_slug: string | null;
  thumbnail_url: string | null;
}
export interface Educator {
  id: string;
  slug: string;
  name: string;
  kind: string;
  focus: string;
  description: string;
  subjects: string[];
  languages: string[];
  levels: string[];
  path_slugs: string[];
  channel_url: string | null;
}
export interface SearchResults {
  catalog: CatalogItem[];
  resources: Resource[];
  educators?: Educator[];
  topics?: {
    id: string;
    title: string;
    description: string;
    type: 'exam' | 'skill';
    slug: string;
  }[];
}
