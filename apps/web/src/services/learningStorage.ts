export interface LearningSnapshot {
  resourceIds: string[];
  roadmapKeys: string[];
  completedTopics: Record<string, string[]>;
}
const storageKey = 'skillflix:learning:v2';
const legacyKey = 'skillflix:bookmarks:v1';
const empty = (): LearningSnapshot => ({ resourceIds: [], roadmapKeys: [], completedTopics: {} });
const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
export const learningStorage = {
  load(): LearningSnapshot {
    try {
      const saved = JSON.parse(
        localStorage.getItem(storageKey) || 'null',
      ) as Partial<LearningSnapshot> | null;
      if (saved) {
        const completed: Record<string, string[]> = {};
        if (saved.completedTopics && typeof saved.completedTopics === 'object')
          for (const [key, value] of Object.entries(saved.completedTopics))
            completed[key] = strings(value);
        return {
          resourceIds: strings(saved.resourceIds),
          roadmapKeys: strings(saved.roadmapKeys),
          completedTopics: completed,
        };
      }
      const legacy = JSON.parse(localStorage.getItem(legacyKey) || '[]');
      return { ...empty(), resourceIds: strings(legacy) };
    } catch {
      return empty();
    }
  },
  save(snapshot: LearningSnapshot) {
    localStorage.setItem(storageKey, JSON.stringify(snapshot));
  },
  clear() {
    localStorage.removeItem(storageKey);
    localStorage.removeItem(legacyKey);
  },
};
