import type { SearchResult } from "../types/index.js";
import { DEFAULT_COMPRESSION_CONFIG } from "./types.js";
import type { CompressionConfig } from "./types.js";

export class CacheCompressor {
  constructor(private config: CompressionConfig = { ...DEFAULT_COMPRESSION_CONFIG }) {}

  compress(results: SearchResult[]): {
    data: string;
    originalBytes: number;
    compressedBytes: number;
  } {
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
      const item: Record<string, unknown> = {
        t: r.title.length > 200 ? r.title.slice(0, 200) : r.title,
        u: r.url,
      };
      if (r.snippet && r.snippet.length > 0) item.s = r.snippet;
      item.src = r.source;
      if (r.rank !== undefined) item.rk = r.rank;
      return item;
    });

    const data = JSON.stringify(compact);
    const compressedBytes = Buffer.byteLength(data, "utf-8");
    return { data, originalBytes, compressedBytes };
  }

  decompress(data: string): SearchResult[] {
    try {
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];

      // Detect compact format: first item has 't' field instead of 'title'
      if (parsed.length > 0 && parsed[0].t !== undefined) {
        return parsed.map((item: Record<string, unknown>) => ({
          title: (item.t as string) ?? "",
          url: (item.u as string) ?? "",
          snippet: (item.s as string) ?? "",
          source: (item.src as SearchResult["source"]) ?? "duckduckgo",
          rank: item.rk as number | undefined,
        }));
      }

      return parsed as SearchResult[];
    } catch {
      return [];
    }
  }
}
