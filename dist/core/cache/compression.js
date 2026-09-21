import { DEFAULT_COMPRESSION_CONFIG } from "./types.js";
export class CacheCompressor {
    config;
    constructor(config = { ...DEFAULT_COMPRESSION_CONFIG }) {
        this.config = config;
    }
    compress(results) {
        if (!this.config.enabled) {
            const data = JSON.stringify(results);
            const bytes = Buffer.byteLength(data, "utf-8");
            return { data, originalBytes: bytes, compressedBytes: bytes };
        }
        const original = JSON.stringify(results);
        const originalBytes = Buffer.byteLength(original, "utf-8");
        if (originalBytes < this.config.minBytesToCompress) {
            return { data: original, originalBytes, compressedBytes: originalBytes };
        }
        const compact = results.map((r) => {
            const item = {
                t: r.title.length > 200 ? r.title.slice(0, 200) : r.title,
                u: r.url,
            };
            if (r.snippet && r.snippet.length > 0)
                item.s = r.snippet;
            item.src = r.source;
            if (r.rank !== undefined)
                item.rk = r.rank;
            return item;
        });
        const data = JSON.stringify(compact);
        const compressedBytes = Buffer.byteLength(data, "utf-8");
        return { data, originalBytes, compressedBytes };
    }
    decompress(data) {
        try {
            const parsed = JSON.parse(data);
            if (!Array.isArray(parsed))
                return [];
            // Detect compact format: first item has 't' field instead of 'title'
            if (parsed.length > 0 && parsed[0].t !== undefined) {
                return parsed.map((item) => ({
                    title: item.t ?? "",
                    url: item.u ?? "",
                    snippet: item.s ?? "",
                    source: item.src ?? "duckduckgo",
                    rank: item.rk,
                }));
            }
            return parsed;
        }
        catch {
            return [];
        }
    }
}
//# sourceMappingURL=compression.js.map