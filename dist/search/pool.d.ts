import type { PoolConfig, PoolStats } from "./types.js";
export declare class ConnectionPool {
    private config;
    private activeCount;
    private totalRequests;
    private reusedConnections;
    private connectionErrors;
    private agentCache;
    private fetchImpl;
    constructor(config?: Partial<PoolConfig>);
    fetch(url: string, options?: RequestInit): Promise<Response>;
    getStats(): PoolStats;
    drain(): Promise<void>;
    close(): Promise<void>;
    private retryFetch;
}
//# sourceMappingURL=pool.d.ts.map