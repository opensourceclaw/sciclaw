import type { SearchResult } from "../types/index.js";

export interface SearchSourceConfig {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  timeoutMs: number;
  weight: number;
  rateLimit?: { maxPerSecond: number; maxPerMinute: number };
}

export interface SearchTask {
  query: string;
  sources: SearchSourceConfig[];
  options?: {
    maxResults?: number;
    abortSignal?: AbortSignal;
    streaming?: boolean;
  };
}

export interface SearchSourceResult {
  sourceId: string;
  results: SearchResult[];
  latencyMs: number;
  error?: string;
}

export interface AggregatedResults {
  results: SearchResult[];
  totalSources: number;
  successfulSources: number;
  failedSources: number;
  totalLatencyMs: number;
  perSource: SearchSourceResult[];
}

export interface StreamEvent {
  type: "result" | "source_complete" | "error" | "complete";
  data?: SearchResult;
  sourceId?: string;
  error?: Error;
  progress?: { completed: number; total: number };
}

export type StreamCallback = {
  result?: (result: SearchResult, sourceId: string) => void;
  source_complete?: (sourceId: string, results: SearchResult[]) => void;
  error?: (error: Error, sourceId: string) => void;
  complete?: (stats: { total: number; latencyMs: number }) => void;
};

export interface BatchConfig {
  maxBatchSize: number;
  maxWaitMs: number;
  flushOnFull: boolean;
}

export const DEFAULT_BATCH_CONFIG: BatchConfig = {
  maxBatchSize: 10,
  maxWaitMs: 50,
  flushOnFull: true,
};

export interface BatchEntry<T> {
  id: string;
  data: T;
  resolve: (result: unknown) => void;
  reject: (error: Error) => void;
  createdAt: number;
}

export interface PoolConfig {
  maxConnections: number;
  maxPerHost: number;
  idleTimeoutMs: number;
  connectTimeoutMs: number;
  keepAlive: boolean;
  retryOnError: boolean;
  maxRetries: number;
}

export const DEFAULT_POOL_CONFIG: PoolConfig = {
  maxConnections: 50,
  maxPerHost: 6,
  idleTimeoutMs: 30_000,
  connectTimeoutMs: 3_000,
  keepAlive: true,
  retryOnError: true,
  maxRetries: 2,
};

export interface PoolStats {
  activeConnections: number;
  idleConnections: number;
  totalRequests: number;
  reusedConnections: number;
  connectionErrors: number;
}

export interface LatencyRecord {
  sourceId: string;
  query: string;
  latencyMs: number;
  timestamp: number;
  success: boolean;
}

export interface MetricsSnapshot {
  p50: number;
  p95: number;
  p99: number;
  avg: number;
  min: number;
  max: number;
  throughput: number;
  totalRequests: number;
  successRate: number;
  perSource: Record<string, { p95: number; avg: number; successRate: number }>;
}

export interface CoordinatorConfig {
  maxConcurrency?: number;
  defaultTimeoutMs?: number;
}

export const DEFAULT_COORDINATOR_CONFIG: CoordinatorConfig = {
  maxConcurrency: 20,
  defaultTimeoutMs: 10_000,
};

export type SearchFn = (query: string, sources: string[]) => Promise<SearchResult[]>;
export type SearchSourceFn = (query: string, maxResults: number, signal: AbortSignal) => Promise<SearchResult[]>;
