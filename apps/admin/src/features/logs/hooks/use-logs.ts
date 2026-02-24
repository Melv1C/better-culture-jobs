import { useSocket } from '@/features/socket';
import { apiClient } from '@/lib/api-client';
import {
  Log$,
  LogWithUser$,
  type Log,
  type LogFilter,
  type LogWithUser,
  type PaginatedLogs,
} from '@repo/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

const LOGS_STALE_TIME = 30000; // 30 seconds
const LOGS_CACHE_TIME = 5 * 60 * 1000; // 5 minutes

export function useLogs(filter: Partial<LogFilter> = {}) {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleLogCreated = (newLog: Log) => {
      const parsedLog = Log$.parse(newLog);

      // Check if the new log matches the current filter
      if (filter.types && !filter.types.includes(parsedLog.type)) return;
      if (filter.levels && !filter.levels.includes(parsedLog.level)) return;
      if (filter.startDate && parsedLog.createdAt < filter.startDate) return;
      if (filter.endDate && parsedLog.createdAt > filter.endDate) return;
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        if (
          !parsedLog.message.toLowerCase().includes(searchLower) &&
          !(parsedLog.path && parsedLog.path.toLowerCase().includes(searchLower))
        ) {
          return;
        }
      }

      queryClient.setQueryData<PaginatedLogs>(['logs', filter], oldData => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: [parsedLog, ...oldData.data],
        };
      });
    };

    socket.on('log:created', handleLogCreated);

    return () => {
      socket.off('log:created', handleLogCreated);
    };
  }, [socket, filter, queryClient]);

  return useQuery({
    queryKey: ['logs', filter],
    queryFn: async (): Promise<PaginatedLogs> => {
      const res = await apiClient.api.logs.$get({
        query: {
          page: filter.page?.toString(),
          pageSize: filter.pageSize?.toString(),
          types: filter.types?.join(','),
          levels: filter.levels?.join(','),
          search: filter.search,
          startDate: filter.startDate?.toISOString(),
          endDate: filter.endDate?.toISOString(),
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch logs: ${errorText || res.statusText}`);
      }

      const result = await res.json();
      return {
        data: Log$.array().parse(result.data),
        pagination: result.pagination,
      };
    },
    placeholderData: previousData => previousData,
    staleTime: LOGS_STALE_TIME,
    gcTime: LOGS_CACHE_TIME,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useLog(id: number | null) {
  return useQuery({
    queryKey: ['log', id],
    queryFn: async (): Promise<LogWithUser> => {
      if (!id) throw new Error('No log ID provided');

      const res = await apiClient.api.logs[':id'].$get({ param: { id: id.toString() } });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch log: ${errorText || res.statusText}`);
      }

      const log = await res.json();
      return LogWithUser$.parse(log);
    },
    enabled: id !== null,
    staleTime: LOGS_STALE_TIME,
    gcTime: LOGS_CACHE_TIME,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
