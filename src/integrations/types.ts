/**
 * Integration types for claw-xxx plugins
 */

// Research session for memory storage
export interface ResearchSession {
  id: string;
  query: string;
  results: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

// Context state
export interface ContextState {
  sessionId: string;
  query?: string;
  results?: unknown[];
  createdAt: number;
  updatedAt: number;
}

// Observability event
export interface ObsEvent {
  name: string;
  timestamp: number;
  data: Record<string, unknown>;
}

// Metrics
export interface ObsMetrics {
  events: number;
  errors: number;
  duration: number;
  custom: Record<string, number>;
}
