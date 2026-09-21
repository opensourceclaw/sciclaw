export const DEFAULT_BATCH_CONFIG = {
    maxBatchSize: 10,
    maxWaitMs: 50,
    flushOnFull: true,
};
export const DEFAULT_POOL_CONFIG = {
    maxConnections: 50,
    maxPerHost: 6,
    idleTimeoutMs: 30_000,
    connectTimeoutMs: 3_000,
    keepAlive: true,
    retryOnError: true,
    maxRetries: 2,
};
export const DEFAULT_COORDINATOR_CONFIG = {
    maxConcurrency: 20,
    defaultTimeoutMs: 10_000,
};
//# sourceMappingURL=types.js.map