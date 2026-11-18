import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { learningStorage, type LearningSnapshot } from '../services/learningStorage';
import { request } from '../services/api';
import { useAuth } from './Auth';
interface LessonProgress {
  resource_id: string;
  completed_at: string | null;
  last_position_seconds: number | null;
  updated_at: string;
}
interface Activity {
  action: string;
  course_id: string | null;
  roadmap_id: string | null;
  topic_id: string | null;
  resource_id: string | null;
  created_at: string;
}
export interface AccountLearning extends LearningSnapshot {
  courseIds: string[];
  lessons: LessonProgress[];
  activity: Activity[];
}
interface LearningContextValue {
  state: AccountLearning;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  isResourceSaved: (id: string) => boolean;
  toggleResource: (id: string) => void;
  isRoadmapSaved: (key: string) => boolean;
  toggleRoadmap: (key: string) => void;
  isCourseSaved: (id: string) => boolean;
  toggleCourse: (id: string) => void;
  isTopicComplete: (key: string, id: string) => boolean;
  toggleTopic: (key: string, id: string) => void;
}
const empty = (): AccountLearning => ({
  resourceIds: [],
  roadmapKeys: [],
  completedTopics: {},
  courseIds: [],
  lessons: [],
  activity: [],
});
const Context = createContext<LearningContextValue | null>(null);
export function LearningProvider({ children }: { children: ReactNode }) {
  const { user, requireAuth } = useAuth();
  const [state, setState] = useState<AccountLearning>(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const refresh = async () => {
    const next = await request<AccountLearning>('/me/learning');
    setState(next);
  };
  useEffect(() => {
    let active = true;
    if (!user) {
      setState(empty());
      return;
    }
    setLoading(true);
    const sync = async () => {
      const legacy = learningStorage.load();
      if (
        legacy.resourceIds.length ||
        legacy.roadmapKeys.length ||
        Object.values(legacy.completedTopics).some((x) => x.length)
      ) {
        await request('/me/learning/import', { method: 'POST', body: JSON.stringify(legacy) });
        learningStorage.clear();
      }
      const next = await request<AccountLearning>('/me/learning');
      if (active) setState(next);
    };
    sync()
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : 'Unable to load learning data');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user?.id]);
  const act = (method: 'PUT' | 'DELETE', path: string) =>
    request(path, { method })
      .then(() => refresh())
      .catch((e) => setError(e instanceof Error ? e.message : 'Unable to save progress'));
  const toggleResource = (id: string) => {
    const method = state.resourceIds.includes(id) ? 'DELETE' : 'PUT';
    if (!user) {
      requireAuth(() => {
        void act('PUT', `/me/learning/bookmarks/${encodeURIComponent(id)}`);
      });
      return;
    }
    void act(method, `/me/learning/bookmarks/${encodeURIComponent(id)}`);
  };
  const toggleRoadmap = (key: string) => {
    const method = state.roadmapKeys.includes(key) ? 'DELETE' : 'PUT';
    if (!user) {
      requireAuth(() => {
        void act('PUT', `/me/learning/roadmaps/${encodeURIComponent(key)}`);
      });
      return;
    }
    void act(method, `/me/learning/roadmaps/${encodeURIComponent(key)}`);
  };
  const toggleCourse = (id: string) => {
    const method = state.courseIds.includes(id) ? 'DELETE' : 'PUT';
    if (!user) {
      requireAuth(() => {
        void act('PUT', `/me/learning/courses/${encodeURIComponent(id)}`);
      });
      return;
    }
    void act(method, `/me/learning/courses/${encodeURIComponent(id)}`);
  };
  const toggleTopic = (key: string, id: string) => {
    const method = (state.completedTopics[key] || []).includes(id) ? 'DELETE' : 'PUT';
    if (!user) {
      requireAuth(() => {
        void act('PUT', `/me/learning/topics/${encodeURIComponent(id)}`);
      });
      return;
    }
    void act(method, `/me/learning/topics/${encodeURIComponent(id)}`);
  };
  return (
    <Context.Provider
      value={{
        state,
        loading,
        error,
        refresh,
        isResourceSaved: (id) => state.resourceIds.includes(id),
        toggleResource,
        isRoadmapSaved: (key) => state.roadmapKeys.includes(key),
        toggleRoadmap,
        isCourseSaved: (id) => state.courseIds.includes(id),
        toggleCourse,
        isTopicComplete: (key, id) => (state.completedTopics[key] || []).includes(id),
        toggleTopic,
      }}
    >
      {error && (
        <div
          role="alert"
          className="border-b border-red-200 bg-red-50 px-5 py-2 text-center text-sm text-red-800"
        >
          {error}
        </div>
      )}
      {children}
    </Context.Provider>
  );
}
export function useLearning() {
  const value = useContext(Context);
  if (!value) throw new Error('Learning provider missing');
  return value;
}
