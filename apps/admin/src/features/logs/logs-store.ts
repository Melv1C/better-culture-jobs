import type { LogFilter } from '@repo/utils';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LogsState {
  filter: Partial<LogFilter>;
  searchInput: string;
  selectedLogId: number | null;
  sheetOpen: boolean;

  setFilter: (filter: Partial<LogFilter>) => void;
  updateFilter: (updates: Partial<LogFilter>) => void;
  setSearchInput: (input: string) => void;
  setSelectedLogId: (id: number | null) => void;
  setSheetOpen: (open: boolean) => void;

  clearFilters: () => void;
  resetSheet: () => void;
}

const initialPageSize = 50;

const initialFilter: Partial<LogFilter> = {
  page: 1,
  pageSize: initialPageSize,
};

export const useLogsStore = create<LogsState>()(
  persist(
    set => ({
      filter: initialFilter,
      searchInput: '',
      selectedLogId: null,
      sheetOpen: false,

      setFilter: filter =>
        set({
          filter: { ...filter, page: filter.page ?? 1 },
        }),

      updateFilter: updates =>
        set(state => ({
          filter: {
            ...state.filter,
            ...updates,
            page: updates.page ?? 1,
          },
        })),

      setSearchInput: input => set({ searchInput: input }),

      setSelectedLogId: id => set({ selectedLogId: id }),

      setSheetOpen: open =>
        set(state => ({
          sheetOpen: open,
          // Reset selected log when closing sheet
          selectedLogId: open ? state.selectedLogId : null,
        })),

      clearFilters: () =>
        set(state => ({
          filter: { page: 1, pageSize: state.filter.pageSize ?? initialPageSize },
          searchInput: '',
        })),

      resetSheet: () =>
        set({
          selectedLogId: null,
          sheetOpen: false,
        }),
    }),
    {
      name: 'logs-store',
      partialize: state => ({
        filter: {
          pageSize: state.filter.pageSize,
          types: state.filter.types,
          levels: state.filter.levels,
        },
      }),
    },
  ),
);
