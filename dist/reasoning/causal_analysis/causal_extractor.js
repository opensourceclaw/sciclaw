/**
 * Causal Extractor - Extracts causal relationships between variables
 */
// Chinese causal patterns
const CN_PATTERNS = [
    /(.*?)(?:导致|引起|使得|造成|促使|引发|触发)(.*?)(?:[。，]|$)/,
    /(?:因为|由于)(.*?)(?:[,，]|所以|因此|因而)(.*?)(?:[。，]|$)/,
    /(.*?)(?:取决于|依赖于|决定于)(.*?)(?:[。，]|$)/,
    /(.*?)(?:有助于|促进|推动|提升)(.*?)(?:[。，]|$)/,
    /(.*?)(?:阻碍|抑制|减少|降低)(.*?)(?:[。，]|$)/,
    /(.*?)(?:源于|来源于|来自于)(.*?)(?:[。，]|$)/,
];
// English causal patterns
const EN_PATTERNS = [
    /(.*?)(?:causes?|leads?\s+to|results?\s+in|triggers?|brings?\s+about|gives?\s+rise\s+to)(.*?)(?:[.，]|$)/i,
    /(?:because\s+of|due\s+to|owing\s+to|as\s+a\s+result\s+of)(.*?)[,，](.*?)(?:[.，]|$)/i,
    /(.*?)(?:depends?\s+on|relies?\s+on|is\s+determined\s+by|is\s+affected\s+by)(.*?)(?:[.，]|$)/i,
    /(.*?)(?:contributes?\s+to|promotes?\s+|enhances?|improves?|boosts?)(.*?)(?:[.，]|$)/i,
    /(.*?)(?:prevents?|reduces?|decreases?|inhibits?|hinders?)(.*?)(?:[.，]|$)/i,
    /(?:if|when)(.*?)[,，](?:then)?(.*?)(?:[.，]|$)/i,
    /(.*?)(?:so|therefore|thus|hence|consequently)(.*?)(?:[.，]|$)/i,
];
const POSITIVE_KEYWORDS = [
    '有助于', '促进', '推动', '提升', '增强', '提高',
    'promote', 'enhance', 'improve', 'boost', 'increase', 'strengthen', 'contribute',
];
const NEGATIVE_KEYWORDS = [
    '阻碍', '抑制', '减少', '降低', '防止', '阻止',
    'prevent', 'reduce', 'decrease', 'inhibit', 'hinder', 'block', 'limit',
];
function generateId() {
    return Math.random().toString(36).slice(2, 10);
}
function detectDirection(relation) {
    const lower = relation.toLowerCase();
    const hasPositive = POSITIVE_KEYWORDS.some((kw) => lower.includes(kw));
    const hasNegative = NEGATIVE_KEYWORDS.some((kw) => lower.includes(kw));
    if (hasPositive && !hasNegative)
        return 'positive';
    if (hasNegative && !hasPositive)
        return 'negative';
    return 'unknown';
}
function matchVariable(text, variables) {
    const lower = text.trim().toLowerCase();
    if (!lower)
        return null;
    for (const v of variables) {
        if (lower.includes(v.name.toLowerCase()))
            return v.id;
        for (const alias of v.aliases) {
            if (lower.includes(alias.toLowerCase()))
                return v.id;
        }
    }
    return null;
}
function calculateConfidence(evidenceText, allEvidence) {
    const evidenceCount = allEvidence.length;
    const maxEvidence = 5;
    const evidenceScore = Math.min(evidenceCount / maxEvidence, 1);
    // Source diversity: unique sentences
    const uniqueSources = new Set(allEvidence.map((e) => e.slice(0, 50))).size;
    const diversityScore = Math.min(uniqueSources / 3, 1);
    return Math.round((evidenceScore * 0.6 + diversityScore * 0.4) * 100) / 100;
}
export class CausalExtractor {
    extract(text, variables) {
        if (!text || !text.trim() || variables.length === 0)
            return [];
        const relations = new Map();
        // Process each sentence
        const sentences = text.split(/[.。!！?？\n]+/).map((s) => s.trim()).filter(Boolean);
        for (const sentence of sentences) {
            const patterns = sentence.match(/[\u4e00-\u9fff]/) ? CN_PATTERNS : EN_PATTERNS;
            for (const pattern of patterns) {
                const match = sentence.match(pattern);
                if (!match)
                    continue;
                let sourceText = match[1]?.trim() ?? '';
                let targetText = match[2]?.trim() ?? '';
                // Determine direction: for "because A, B" patterns, A is cause, B is effect
                const isReversePattern = /^(?:because\s+of|due\s+to|owing\s+to|因为|由于)/i.test(match[0]);
                if (isReversePattern) {
                    [sourceText, targetText] = [targetText, sourceText];
                }
                const sourceId = matchVariable(sourceText, variables);
                const targetId = matchVariable(targetText, variables);
                if (!sourceId || !targetId || sourceId === targetId)
                    continue;
                const relation = match[0];
                const direction = detectDirection(relation);
                const key = `${sourceId}->${targetId}`;
                const existing = relations.get(key);
                if (existing) {
                    existing.confidence = Math.min(existing.confidence + 0.2, 1);
                    if (!existing.evidence.includes(sentence)) {
                        existing.evidence.push(sentence);
                    }
                }
                else {
                    relations.set(key, {
                        id: generateId(),
                        sourceId,
                        targetId,
                        relation,
                        strength: direction === 'unknown' ? 0.5 : 0.7,
                        direction,
                        confidence: calculateConfidence(relation, [sentence]),
                        evidence: [sentence],
                    });
                }
            }
        }
        return Array.from(relations.values());
    }
}
//# sourceMappingURL=causal_extractor.js.map