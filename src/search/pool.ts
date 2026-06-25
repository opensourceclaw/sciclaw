import { DEFAULT_POOL_CONFIG } from "./types.js";
import type { PoolConfig, PoolStats } from "./types.js";

interface AgentLike {
  fetch(url: string | URL, init?: RequestInit): Promise<Response>;
}

export class ConnectionPool {
  private config: PoolConfig;
  private activeCount = 0;
  private totalRequests = 0;
  private reusedConnections = 0;
  private connectionErrors = 0;
  private agentCache: unknown | null = null;
  private fetchImpl: typeof fetch;

  constructor(config?: Partial<PoolConfig>) {
    this.config = { ...DEFAULT_POOL_CONFIG, ...config };
    this.fetchImpl = globalThis.fetch.bind(globalThis);
    if (!this.config.keepAlive) {
      this.agentCache = null;
    }
  }

  async fetch(url: string, options?: RequestInit): Promise<Response> {
    this.totalRequests++;
    this.activeCount++;

    try {
      const signal = options?.signal;
      const timeoutMs = this.config.connectTimeoutMs;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const mergedSignal = signal
        ? anySignal([signal, controller.signal])
        : controller.signal;

      const fetchOptions: RequestInit = {
        ...options,
        signal: mergedSignal,
      };

      const response = await this.fetchImpl(url, fetchOptions);
      clearTimeout(timeout);
      this.activeCount--;
      this.reusedConnections++;
      return response;
    } catch (e) {
      this.activeCount--;
      this.connectionErrors++;
      if (this.config.retryOnError && this.config.maxRetries > 0) {
        return this.retryFetch(url, options, this.config.maxRetries);
      }
      throw e;
    }
  }

  getStats(): PoolStats {
    return {
      activeConnections: this.activeCount,
      idleConnections: 0,
      totalRequests: this.totalRequests,
      reusedConnections: this.reusedConnections,
      connectionErrors: this.connectionErrors,
    };
  }

  async drain(): Promise<void> {
    this.activeCount = 0;
  }

  async close(): Promise<void> {
    this.agentCache = null;
    this.activeCount = 0;
  }

  private async retryFetch(url: string, options: RequestInit | undefined, retries: number): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      try {
        this.activeCount++;
        const response = await this.fetchImpl(url, options);
        this.activeCount--;
        this.reusedConnections++;
        return response;
      } catch {
        this.activeCount--;
        this.connectionErrors++;
        if (i === retries - 1) throw new Error(`Connection failed after ${retries} retries`);
      }
    }
    throw new Error(`Connection failed after ${retries} retries`);
  }
}

function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return controller.signal;
    }
    signal.addEventListener("abort", () => controller.abort(signal.reason), { once: true });
  }
  return controller.signal;
}
