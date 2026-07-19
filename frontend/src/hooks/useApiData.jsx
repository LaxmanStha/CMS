import { useState, useEffect, useCallback } from 'react';
import api from '@/services/api';

/**
 * Fetches a collection from the backend and exposes loading/error state.
 *
 * Data is always sourced from the database via the API; there is no
 * hardcoded fallback. If the endpoint is unavailable the list is simply
 * empty and the error/empty UI is shown.
 */
export function useApiData(endpoint) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(endpoint);
      const payload = res.data;
      const list = Array.isArray(payload) ? payload : (payload?.data || []);
      setData(list);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load data');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, setData, loading, error, reload: load };
}

export default useApiData;
