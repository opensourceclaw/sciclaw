export { SearchCache } from "./search-cache.js";
export { CacheAnalytics } from "./analytics.js";
export { InvalidationManager } from "./invalidation.js";
export { CacheCompressor } from "./compression.js";
export { CacheWarmer } from "./warmer.js";
export { DistributedCache } from "./distributed.js";
import { SearchCache } from "./search-cache.js";
// Global singleton — backward compatible with v3.0.x API
let globalCache = null;
export function getCache(ttl, maxSize) {
    if (!globalCache) {
        globalCache = new SearchCache({ ttl, maxSize });
    }
    return globalCache;
}
export function clearCache() {
    globalCache?.clear();
}
export function setGlobalCache(cache) {
    globalCache = cache;
}
//# sourceMappingURL=index.js.map