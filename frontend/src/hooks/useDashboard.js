import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

const DASHBOARD_STALE = 60_000;
const ME_STALE = 5 * 60_000;

export function useMe(userId) {
  return useQuery({
    queryKey: ['me', userId],
    queryFn: async () => (await api.get(`/me?userId=${userId}`)).data,
    enabled: !!userId,
    staleTime: ME_STALE,
    retry: 2,
  });
}

export function useFacultyDashboard(personId) {
  return useQuery({
    queryKey: ['teacher-dashboard', personId],
    queryFn: async () => (await api.get(`/teachers/dashboard?id=${personId}`)).data,
    enabled: !!personId,
    staleTime: DASHBOARD_STALE,
    retry: 2,
  });
}

export function useStudentDashboard(personId) {
  return useQuery({
    queryKey: ['student-dashboard', personId],
    queryFn: async () => (await api.get(`/student/dashboard?id=${personId}`)).data,
    enabled: !!personId,
    staleTime: DASHBOARD_STALE,
    retry: 2,
  });
}

export function useAccountDashboard() {
  return useQuery({
    queryKey: ['account-dashboard'],
    queryFn: async () => (await api.get('/account/dashboard')).data,
    staleTime: DASHBOARD_STALE,
    retry: 2,
  });
}

export function useApiQuery(endpoint, key) {
  return useQuery({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: async () => (await api.get(endpoint)).data,
    staleTime: DASHBOARD_STALE,
  });
}
