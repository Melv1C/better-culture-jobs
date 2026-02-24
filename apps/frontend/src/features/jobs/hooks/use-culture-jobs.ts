import { apiClient } from '@/lib/api-client';
import { CultureBeJobsResponse$, type CultureBeJobsResponse } from '@repo/utils';
import { useQuery } from '@tanstack/react-query';

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
