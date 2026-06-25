export const DEFAULT_ANALYTICS_CONFIG = {
    enabled: true,
    sampleRate: 1.0,
    topKLimit: 10,
    maxKeysInMemory: 10000,
    flushIntervalMs: 60000,
};
export const DEFAULT_INVALIDATION_CONFIG = {
    strategy: "adaptive",
    defaultTTL: 3600,
    sourceTTLs: {},
    topicWindowMs: 1800000,
    minTTL: 300,
    maxTTL: 86400,
};
export const DEFAULT_COMPRESSION_CONFIG = {
    enabled: true,
    algorithm: "json",
    minBytesToCompress: 1024,
    level: "fast",
};
export const DEFAULT_WARMER_CONFIG = {
    enabled: true,
    queries: [],
    engines: ["duckduckgo"],
    concurrency: 2,
    timeoutMs: 10000,
    topKFromAnalytics: true,
    topKLimit: 10,
};
export const DEFAULT_DISTRIBUTED_CONFIG = {
    enabled: false,
    redis: {
        host: "127.0.0.1",
        port: 6379,
        db: 0,
        keyPrefix: "deepclaw:cache:",
        connectTimeoutMs: 2000,
        maxRetries: 3,
    },
    fallback: "local",
};
export const DEFAULT_CACHE_CONFIG = {
    ttl: 3600,
    maxSize: 100,
};
//# sourceMappingURL=types.js.map