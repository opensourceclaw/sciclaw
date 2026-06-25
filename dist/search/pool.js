import { DEFAULT_POOL_CONFIG } from "./types.js";
export class ConnectionPool {
    config;
    activeCount = 0;
    totalRequests = 0;
    reusedConnections = 0;
    connectionErrors = 0;
    agentCache = null;
    fetchImpl;
    constructor(config) {
        this.config = { ...DEFAULT_POOL_CONFIG, ...config };
        this.fetchImpl = globalThis.fetch.bind(globalThis);
        if (!this.config.keepAlive) {
            this.agentCache = null;
        }
    }
    async fetch(url, options) {
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
            const fetchOptions = {
                ...options,
                signal: mergedSignal,
            };
            const response = await this.fetchImpl(url, fetchOptions);
            clearTimeout(timeout);
            this.activeCount--;
            this.reusedConnections++;
            return response;
        }
        catch (e) {
            this.activeCount--;
            this.connectionErrors++;
            if (this.config.retryOnError && this.config.maxRetries > 0) {
                return this.retryFetch(url, options, this.config.maxRetries);
            }
            throw e;
        }
    }
    getStats() {
        return {
            activeConnections: this.activeCount,
            idleConnections: 0,
            totalRequests: this.totalRequests,
            reusedConnections: this.reusedConnections,
            connectionErrors: this.connectionErrors,
        };
    }
    async drain() {
        this.activeCount = 0;
    }
    async close() {
        this.agentCache = null;
        this.activeCount = 0;
    }
    async retryFetch(url, options, retries) {
        for (let i = 0; i < retries; i++) {
            try {
                this.activeCount++;
                const response = await this.fetchImpl(url, options);
                this.activeCount--;
                this.reusedConnections++;
                return response;
            }
            catch {
                this.activeCount--;
                this.connectionErrors++;
                if (i === retries - 1)
                    throw new Error(`Connection failed after ${retries} retries`);
            }
        }
        throw new Error(`Connection failed after ${retries} retries`);
    }
}
function anySignal(signals) {
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
//# sourceMappingURL=pool.js.map