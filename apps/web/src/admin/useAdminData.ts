import { useCallback, useEffect, useState } from 'react';
import { request } from '../services/api';
export function useAdminData<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await request<T>(`/admin${path}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load data');
    } finally {
      setLoading(false);
    }
  }, [path]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return { data, loading, error, refresh };
}
