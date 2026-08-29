import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export function useMe(userId) {
  return useQuery({
    queryKey: ['me', userId],
    queryFn: async () => (await api.get(`/me?userId=${userId}`)).data,
    enabled: !!userId,
  });
}

export function useFacultyDashboard(personId) {
  return useQuery({
    queryKey: ['faculty-dashboard', personId],
    queryFn: async () => (await api.get(`/faculty/dashboard?id=${personId}`)).data,
    enabled: !!personId,
  });
}

export function useStudentDashboard(personId) {
  return useQuery({
    queryKey: ['student-dashboard', personId],
    queryFn: async () => (await api.get(`/student/dashboard?id=${personId}`)).data,
    enabled: !!personId,
  });
}

export function useAccountDashboard() {
  return useQuery({
    queryKey: ['account-dashboard'],
    queryFn: async () => (await api.get('/account/dashboard')).data,
  });
}

export function useApiQuery(endpoint, key) {
  return useQuery({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: async () => (await api.get(endpoint)).data,
  });
}
