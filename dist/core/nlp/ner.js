/**
 * Named Entity Recognition (NER)
 */
// Regex patterns for entity extraction
const PATTERNS = {
    PERSON: [
        // Names with capital letters (simplified)
        /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g,
    ],
    ORG: [
        // Organizations with common suffixes
        /\b([A-Z][A-Za-z]+ (?:Inc|Corp|LLC|Ltd|Company|Corporation|Group|Foundation|Institute|University|College))\b/g,
        /\b([A-Z]{2,})\b/g, // Acronyms like NASA, IBM
    ],
    LOC: [
        // Locations with common patterns
        /\b([A-Z][a-z]+(?: City| State| Country| County| Province| Region))\b/g,
        /\b([A-Z][a-z]+, [A-Z]{2})\b/g, // City, State
    ],
    DATE: [
        /\b(\d{4}-\d{2}-\d{2})\b/g, // ISO date
        /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/g, // US date
        /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4})\b/gi, // Month Day, Year
    ],
    TIME: [
        /\b(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\b/gi, // Time
    ],
    MONEY: [
        // Fixed: Remove \b which conflicts with currency symbols
        /(\$[\d,]+(?:\.\d{2})?)/g, // Dollar
        /(¥[\d,]+(?:\.\d{2})?)/g, // Yen/Yuan
        /(€[\d,]+(?:\.\d{2})?)/g, // Euro
        /(£[\d,]+(?:\.\d{2})?)/g, // Pound
    ],
    PERCENT: [
        // Fixed: Remove \b which conflicts with %
        /(\d+(?:\.\d+)?%)/g,
    ],
    EMAIL: [
        /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g,
    ],
    URL: [
        /\b(https?:\/\/[^\s<]+)\b/g,
    ],
};
/**
 * Extract entities from text
 */
export function extractEntities(text) {
    const entities = [];
    for (const [type, patterns] of Object.entries(PATTERNS)) {
        for (const pattern of patterns) {
            // Create a new regex to avoid lastIndex issues
            const regex = new RegExp(pattern.source, pattern.flags);
            let match;
            while ((match = regex.exec(text)) !== null) {
                const matchedText = match[1] ?? match[0];
                const start = match.index + (match[0].indexOf(matchedText));
                // Check for overlap with existing entities
                const overlaps = entities.some((e) => start < e.end && start + matchedText.length > e.start);
                if (!overlaps) {
                    entities.push({
                        text: matchedText,
                        type,
                        start,
                        end: start + matchedText.length,
                        confidence: 0.8, // Default confidence for regex-based extraction
                    });
                }
            }
        }
    }
    // Sort by position
    return entities.sort((a, b) => a.start - b.start);
}
/**
 * Extract entities with custom patterns
 */
export function extractEntitiesWithCustom(text, customPatterns) {
    const allPatterns = { ...PATTERNS, ...customPatterns };
    const entities = [];
    for (const [type, patterns] of Object.entries(allPatterns)) {
        for (const pattern of patterns) {
            const regex = new RegExp(pattern.source, pattern.flags);
            let match;
            while ((match = regex.exec(text)) !== null) {
                const matchedText = match[1] ?? match[0];
                const start = match.index + (match[0].indexOf(matchedText));
                entities.push({
                    text: matchedText,
                    type,
                    start,
                    end: start + matchedText.length,
                    confidence: 0.8,
                });
            }
        }
    }
    return entities.sort((a, b) => a.start - b.start);
}
//# sourceMappingURL=ner.js.map