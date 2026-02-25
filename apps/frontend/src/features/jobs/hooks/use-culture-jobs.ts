import { apiClient } from '@/lib/api-client';
import {
  CultureBeJob$,
  CultureBeJobsResponse$,
  CultureBeJobSyncResponse$,
  type CultureBeJobsResponse,
  type CultureBeJobSyncResponse,
} from '@repo/utils';
import { useMutation, useQuery } from '@tanstack/react-query';

const JOBS_STALE_TIME = 30000;
const JOBS_CACHE_TIME = 5 * 60 * 1000;

export function useCultureJobs() {
  return useQuery({
    queryKey: ['culture-jobs'],
    queryFn: async (): Promise<CultureBeJobsResponse> => {
      const res = await apiClient.api.jobs.$get();

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch jobs: ${errorText || res.statusText}`);
      }

      const result = await res.json();
      return CultureBeJobsResponse$.parse(result);
    },
    staleTime: JOBS_STALE_TIME,
    gcTime: JOBS_CACHE_TIME,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useSyncCultureJobs() {
  return useMutation({
    mutationFn: async (): Promise<CultureBeJobSyncResponse> => {
      const res = await apiClient.api.jobs.sync.$post();

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to sync jobs: ${errorText || res.statusText}`);
      }

      const result = await res.json();
      return CultureBeJobSyncResponse$.parse(result);
    },
  });
}

export function useCultureJob(id: string | null) {
  return useQuery({
    queryKey: ['culture-job', id],
    queryFn: async () => {
      if (!id) {
        throw new Error('No job id provided');
      }

      const res = await apiClient.api.jobs[':id'].$get({ param: { id } });

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Cette offre n'existe pas ou n'est plus disponible.");
        }
        const errorText = await res.text();
        throw new Error(`Failed to fetch job detail: ${errorText || res.statusText}`);
      }

      const result = await res.json();
      return CultureBeJob$.parse(result);
    },
    enabled: id !== null,
    staleTime: JOBS_STALE_TIME,
    gcTime: JOBS_CACHE_TIME,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
