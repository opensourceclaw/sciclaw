// Search Types
export type SearchEngine = 'duckduckgo' | 'serpapi' | 'tavily';

export interface SearchRequest {
  query: string;
  engine: SearchEngine;
  maxResults: number;
  includeMarkdown: boolean;
}

export interface SearchResult {
  id: string;
  title: string;
  url: string;
  snippet: string;
  publishedAt?: string;
  score: number;
}

export interface SearchResponse {
  results: SearchResult[];
  totalResults: number;
  query: string;
  engine: SearchEngine;
}

// Filter Types
export interface FilterState {
  dateRange?: {
    start: string;
    end: string;
  };
  scoreMin?: number;
  source?: string;
}

// Pagination Types
export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

// Report Types
export interface Source {
  id: string;
  title: string;
  url: string;
  accessedAt: string;
}

export interface Report {
  id: string;
  title: string;
  query: string;
  createdAt: string;
  content: string;
  sources: Source[];
}

// Store Types
export interface ResearchStore {
  // Search State
  query: string;
  engine: SearchEngine;
  results: SearchResult[];
  isSearching: boolean;
  searchError: string | null;
  
  // Results State
  filters: FilterState;
  pagination: PaginationState;
  
  // Report State
  currentReport: Report | null;
  reports: Report[];
  
  // Actions
  setQuery: (query: string) => void;
  setEngine: (engine: SearchEngine) => void;
  executeSearch: (query: string) => Promise<void>;
  setFilters: (filters: FilterState) => void;
  setPage: (page: number) => void;
  setCurrentReport: (report: Report | null) => void;
  loadReports: () => Promise<void>;
  loadReport: (id: string) => Promise<void>;
}
