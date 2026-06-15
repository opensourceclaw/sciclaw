/**
 * Web search utilities
 */
export function buildSearchUrl(engine, query) {
    const encoded = encodeURIComponent(query);
    switch (engine) {
        case 'duckduckgo':
            return `https://duckduckgo.com/?q=${encoded}`;
        case 'google':
            return `https://www.google.com/search?q=${encoded}`;
        case 'bing':
            return `https://www.bing.com/search?q=${encoded}`;
        default:
            return `https://duckduckgo.com/?q=${encoded}`;
    }
}
//# sourceMappingURL=web_search.js.map