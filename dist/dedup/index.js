/**
 * Deduplication module
 */
export function deduplicateByUrl(results) {
    const seen = new Map();
    for (const result of results) {
        const normalized = normalizeUrl(result.url);
        if (!seen.has(normalized)) {
            seen.set(normalized, result);
        }
    }
    return Array.from(seen.values());
}
export function deduplicateByTitle(results) {
    const seen = new Map();
    for (const result of results) {
        const normalized = normalizeTitle(result.title);
        if (!seen.has(normalized)) {
            seen.set(normalized, result);
        }
    }
    return Array.from(seen.values());
}
function normalizeUrl(url) {
    try {
        const parsed = new URL(url);
        // Remove trailing slash and common tracking params
        parsed.searchParams.delete('utm_source');
        parsed.searchParams.delete('utm_medium');
        parsed.searchParams.delete('utm_campaign');
        let normalized = parsed.origin + parsed.pathname;
        if (parsed.search)
            normalized += parsed.search;
        return normalized.replace(/\/$/, '');
    }
    catch {
        return url;
    }
}
function normalizeTitle(title) {
    return title.toLowerCase().trim().replace(/\s+/g, ' ');
}
//# sourceMappingURL=index.js.map