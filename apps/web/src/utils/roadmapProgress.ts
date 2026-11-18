import { roadmapTopics } from '../data/roadmaps';
import type { Roadmap } from '../types/roadmap';
export function roadmapProgress(roadmap: Roadmap, completedIds: string[]) {
  const topics = roadmapTopics(roadmap);
  const completed = new Set(completedIds);
  const count = topics.filter((topic) => completed.has(topic.id)).length;
  return {
    count,
    total: topics.length,
    percent: topics.length ? Math.round((count / topics.length) * 100) : 0,
    next: topics.find((topic) => !completed.has(topic.id)) || null,
  };
}
