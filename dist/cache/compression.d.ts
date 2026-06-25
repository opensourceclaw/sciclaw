import type { SearchResult } from "../types/index.js";
import type { CompressionConfig } from "./types.js";
export declare class CacheCompressor {
    private config;
    constructor(config?: CompressionConfig);
    compress(results: SearchResult[]): {
        data: string;
        originalBytes: number;
        compressedBytes: number;
    };
    decompress(data: string): SearchResult[];
}
//# sourceMappingURL=compression.d.ts.map