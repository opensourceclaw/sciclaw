import { create } from 'zustand';
import type { ResearchStore, SearchEngine, FilterState, PaginationState, Report } from '../types';
import { searchApi, reportsApi } from '../api/researchApi';

const initialPagination: PaginationState = {
  page: 1,
  pageSize: 10,
  total: 0,
};

const initialFilters: FilterState = {};

export const useResearchStore = create<ResearchStore>((set, get) => ({
  // Initial State
  query: '',
  engine: 'duckduckgo',
  results: [],
  isSearching: false,
  searchError: null,
  filters: initialFilters,
  pagination: initialPagination,
  currentReport: null,
  reports: [],
  
  // Actions
  setQuery: (query: string) => set({ query }),
  
  setEngine: (engine: SearchEngine) => set({ engine }),
  
  executeSearch: async (query: string) => {
    const { engine } = get();
    set({ isSearching: true, searchError: null, results: [] });
    
    try {
      const response = await searchApi.execute({
        query,
        engine,
        maxResults: 20,
        includeMarkdown: true,
      });
      
      set({
        results: response.results,
        pagination: {
          ...initialPagination,
          total: response.totalResults,
        },
        isSearching: false,
      });
    } catch (error) {
      set({
        searchError: error instanceof Error ? error.message : 'Search failed',
        isSearching: false,
      });
    }
  },
  
  setFilters: (filters: FilterState) => set({ filters }),
  
  setPage: (page: number) => set((state) => ({
    pagination: { ...state.pagination, page },
  })),
  
  setCurrentReport: (report: Report | null) => set({ currentReport: report }),
  
  loadReports: async () => {
    try {
      const reports = await reportsApi.list();
      set({ reports });
    } catch (error) {
      console.error('Failed to load reports:', error);
    }
  },
  
  loadReport: async (id: string) => {
    try {
      const report = await reportsApi.get(id);
      set({ currentReport: report });
    } catch (error) {
      console.error('Failed to load report:', error);
    }
  },
}));
