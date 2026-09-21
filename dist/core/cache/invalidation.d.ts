import type { SearchEngine } from "../types/index.js";
import type { InvalidationConfig } from "./types.js";
export declare class InvalidationManager {
    private config;
    private topicWindows;
    constructor(config?: InvalidationConfig);
    computeTTL(params: {
        query: string;
        engines: SearchEngine[];
        accessCount: number;
        lastAccessGapMs: number;
        baseTTLSeconds?: number;
    }): number;
    extractTopic(query: string): string;
    invalidateByTopic(topic: string): void;
    invalidateBySource(_source: string): void;
    getConfig(): InvalidationConfig;
    private computeTopicTTL;
    private computeSourceTTL;
    private computeAdaptiveTTL;
    private computeSourceFactor;
}
//# sourceMappingURL=invalidation.d.ts.map