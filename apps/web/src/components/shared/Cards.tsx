import type { CatalogItem, Resource } from '../../types';
import { PathCard, PlaylistCard } from '../../design/Common';
export function CatalogCard({ item }: { item: CatalogItem }) {
  return <PathCard item={item} />;
}
export function ResourceCard({ resource }: { resource: Resource }) {
  return <PlaylistCard resource={resource} />;
}
