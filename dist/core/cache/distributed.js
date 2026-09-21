import { DEFAULT_DISTRIBUTED_CONFIG } from "./types.js";
export class DistributedCache {
    config;
    compressor;
    redis = null;
    healthy = false;
    reconnectTimer = null;
    redisFactory = null;
    constructor(config = { ...DEFAULT_DISTRIBUTED_CONFIG }, compressor, redisFactory) {
        this.config = config;
        this.compressor = compressor;
        this.redisFactory = redisFactory ?? null;
    }
    async connect() {
        if (!this.config.enabled || !this.config.redis)
            return false;
        try {
            let factory;
            if (this.redisFactory) {
                factory = this.redisFactory;
            }
            else {
                try {
                    const mod = await import("ioredis");
                    factory = (mod.default ?? mod.Redis);
                }
                catch {
                    try {
                        const mod = await import("redis");
                        factory = (mod.default ?? mod.Redis);
                    }
                    catch {
                        return false;
                    }
                }
            }
            const r = this.config.redis;
            const redis = factory({
                host: r.host,
                port: r.port,
                password: r.password ?? undefined,
                db: r.db ?? 0,
                keyPrefix: r.keyPrefix ?? undefined,
                connectTimeout: r.connectTimeoutMs,
                maxRetriesPerRequest: r.maxRetries,
                lazyConnect: true,
            });
            if (redis.connect) {
                await redis.connect();
            }
            this.redis = redis;
            this.healthy = true;
            redis.on("error", () => this.markUnhealthy());
            this.startReconnect();
            return true;
        }
        catch {
            this.healthy = false;
            return false;
        }
    }
    async disconnect() {
        if (this.reconnectTimer) {
            clearInterval(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.redis) {
            try {
                await this.redis.quit();
            }
            catch {
                // ok
            }
            this.redis = null;
        }
        this.healthy = false;
    }
    async get(key) {
        if (!this.healthy || !this.redis)
            return null;
        try {
            const raw = await this.redis.get(key);
            if (!raw)
                return null;
            return this.compressor.decompress(raw);
        }
        catch {
            this.markUnhealthy();
            return null;
        }
    }
    async set(key, results, ttl) {
        if (!this.healthy || !this.redis)
            return;
        try {
            const { data } = this.compressor.compress(results);
            await this.redis.setex(key, ttl, data);
        }
        catch {
            this.markUnhealthy();
        }
    }
    isHealthy() {
        return this.healthy;
    }
    markUnhealthy() {
        this.healthy = false;
    }
    startReconnect() {
        if (this.reconnectTimer)
            return;
        this.reconnectTimer = setInterval(() => {
            if (!this.healthy && this.config.enabled) {
                this.connect().catch(() => { });
            }
        }, 30_000);
    }
}
//# sourceMappingURL=distributed.js.map