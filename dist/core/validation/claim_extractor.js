import crypto from "crypto";
import { ClaimType } from "./types.js";
const FACTUAL_INDICATORS = [
    /\b(?:is|are|was|were|has|have|had|will|shall)\b/i,
    /\b(?:according to|as stated by|reported by|confirmed by|verified by)\b/i,
    /\b(?:research shows|studies show|evidence suggests|data indicates)\b/i,
    /\b(?:found that|discovered that|demonstrated that|proved that)\b/i,
    /\b(?:in fact|indeed|actually|clearly|obviously|undoubtedly)\b/i,
];
const NUMERIC_PATTERNS = [
    /(\d+(?:\.\d+)?\s*%)/,
    /(\d+(?:,\d{3})*(?:\.\d+)?\s*(?:million|billion|trillion|thousand|hundred))/i,
    /(\d+(?:\.\d+)?\s*(?:USD|EUR|GBP|JPY|CNY|dollars|euros|pounds|yuan))/i,
    /(\d+(?:\.\d+)?\s*(?:kg|g|mg|km|m|cm|mm|L|mL|°C|°F|hours|minutes|seconds|days|years))/i,
    /(?<!\w)(\d+(?:,\d{3})+(?:\.\d+)?)(?!\w)/,
    /(?<!\w)(\d+(?:\.\d+)?)(?!\w)/,
];
const QUOTATION_PATTERNS = [/"[^"]{20,}"/, /'[^']{20,}'/, /\u201c[^\u201d]{20,}\u201d/, /\u2018[^\u2019]{20,}\u2019/];
const COMPARISON_PATTERNS = [
    /\b(?:more|less)\s+(?:than|compared to|relative to)\b/i,
    /\b(?:higher|lower|greater|smaller|larger|faster|slower)\s+than\b/i,
    /\b(?:compared to|compared with|in comparison|by contrast)\b/i,
    /\b(?:as\s+\w+\s+as)\b/i,
    /\b(?:increased by|decreased by|rose by|fell by|grew by|declined by)\b/i,
    /\b(?:up\s+\d+%|down\s+\d+%)\b/i,
];
const CAUSATION_PATTERNS = [
    /\b(?:causes?|caused by|resulting in|leads? to|led to|leading to)\b/i,
    /\b(?:because of|due to|owing to|as a result of)\b/i,
    /\b(?:therefore|thus|hence|consequently|accordingly)\b/i,
    /\b(?:if\s+\w+.*then)\b/i,
    /\b(?:responsible for|contributes? to|triggers?)\b/i,
];
const OPINION_INDICATORS = [
    /\b(?:I think|I believe|in my opinion|I feel|it seems|it appears)\b/i,
    /\b(?:probably|possibly|perhaps|maybe|likely|unlikely|potentially)\b/i,
    /\b(?:might be|could be|may be|should be|would be)\b/i,
    /\b(?:arguably|supposedly|allegedly|reportedly|apparently)\b/i,
    /\b(?:best|worst|greatest|amazing|terrible|awful|wonderful|horrible)\b/i,
];
const DATE_PATTERNS = [
    /\b(\d{4}-\d{2}-\d{2})\b/,
    /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/,
    /\b(\d{1,2}\.\d{1,2}\.\d{2,4})\b/,
    /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4})\b/i,
    /\b(\d{1,2} (?:January|February|March|April|May|June|July|August|September|October|November|December) \d{4})\b/i,
    /\b((?:19|20)\d{2})\b/,
];
const SENTENCE_SPLIT = /(?<=[.!?。！？\n])\s+/;
const CLAIM_TYPE_RISK = {
    factual: 0.1,
    numeric: 0.2,
    quotation: 0.15,
    comparison: 0.3,
    causation: 0.5,
    opinion: 0.7,
};
const SUGGESTED_FIXES = {
    healthScore: {
        critical: "Investigate and resolve critical health degradation immediately",
        warning: "Review system health trends and consider preventive maintenance",
        info: "Monitor health score for further degradation",
    },
};
const UNIT_MAP = {
    "%": "percentage",
    dollars: "USD",
    USD: "USD",
    EUR: "EUR",
    GBP: "GBP",
    kg: "kg",
    g: "g",
    mg: "mg",
    km: "km",
    m: "m",
    cm: "cm",
    mm: "mm",
    L: "L",
    mL: "mL",
    "°C": "celsius",
    "°F": "fahrenheit",
    hours: "hours",
    minutes: "minutes",
    seconds: "seconds",
    days: "days",
    years: "years",
    million: "count",
    billion: "count",
    trillion: "count",
    thousand: "count",
    hundred: "count",
};
function clamp(v) {
    return Math.max(0, Math.min(1, v));
}
export class ClaimExtractor {
    compiled;
    constructor() {
        this.compiled = {
            factual: FACTUAL_INDICATORS.map((p) => new RegExp(p.source, p.flags)),
            causation: CAUSATION_PATTERNS.map((p) => new RegExp(p.source, p.flags)),
            comparison: COMPARISON_PATTERNS.map((p) => new RegExp(p.source, p.flags)),
            opinion: OPINION_INDICATORS.map((p) => new RegExp(p.source, p.flags)),
        };
    }
    extractClaims(text, sourceUrl, sourceTitle) {
        if (!text || !text.trim())
            return [];
        const sentences = this.splitSentences(text);
        const claims = [];
        for (const rawSentence of sentences) {
            const sentence = rawSentence.trim();
            if (sentence.length < 10)
                continue;
            const claimType = this.classifyClaim(sentence);
            const numericData = this.extractNumeric(sentence);
            const dates = this.extractDates(sentence);
            const pos = text.indexOf(sentence);
            claims.push({
                id: crypto.randomUUID(),
                text: sentence,
                type: claimType.type,
                confidence: clamp(claimType.confidence),
                position: Math.max(0, pos),
                length: sentence.length,
                sourceUrl,
                sourceTitle,
                numericData: numericData ?? undefined,
                dates,
                metadata: {},
            });
        }
        return claims;
    }
    extractNumericClaims(text) {
        if (!text)
            return [];
        const results = [];
        for (const pattern of NUMERIC_PATTERNS) {
            const regex = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
            let match;
            while ((match = regex.exec(text)) !== null) {
                const valueStr = match[1].replace(/,/g, "").trim();
                const value = parseFloat(valueStr.replace(/%$/, ""));
                if (!isNaN(value)) {
                    results.push({
                        value,
                        unit: this.detectUnit(match[0]),
                        context: this.getContext(text, match.index, match.index + match[0].length),
                        position: match.index,
                        originalText: match[0].trim(),
                    });
                }
            }
        }
        return results;
    }
    getStatistics(claims) {
        if (claims.length === 0) {
            return { totalClaims: 0, byType: {}, averageConfidence: 0 };
        }
        const byType = {};
        for (const c of claims) {
            byType[c.type] = (byType[c.type] ?? 0) + 1;
        }
        const avgConf = claims.reduce((s, c) => s + c.confidence, 0) / claims.length;
        return { totalClaims: claims.length, byType, averageConfidence: Math.round(avgConf * 1000) / 1000 };
    }
    classifyClaim(sentence) {
        const scores = new Map();
        if (QUOTATION_PATTERNS.some((p) => p.test(sentence))) {
            scores.set(ClaimType.QUOTATION, 0.85);
        }
        if (/\d+/.test(sentence)) {
            scores.set(ClaimType.NUMERIC, 0.7);
        }
        const causationCount = this.compiled.causation.filter((p) => p.test(sentence)).length;
        if (causationCount > 0) {
            scores.set(ClaimType.CAUSATION, Math.min(0.9, 0.5 + causationCount * 0.15));
        }
        const comparisonCount = this.compiled.comparison.filter((p) => p.test(sentence)).length;
        if (comparisonCount > 0) {
            scores.set(ClaimType.COMPARISON, Math.min(0.9, 0.5 + comparisonCount * 0.15));
        }
        const factualCount = this.compiled.factual.filter((p) => p.test(sentence)).length;
        if (factualCount > 0) {
            scores.set(ClaimType.FACTUAL, Math.min(0.85, 0.4 + factualCount * 0.1));
        }
        const opinionCount = this.compiled.opinion.filter((p) => p.test(sentence)).length;
        if (opinionCount > 0) {
            scores.set(ClaimType.OPINION, Math.min(0.85, 0.4 + opinionCount * 0.1));
        }
        if (scores.size === 0) {
            return { type: ClaimType.FACTUAL, confidence: 0.3 };
        }
        let bestType = ClaimType.FACTUAL;
        let bestScore = 0;
        for (const [type, score] of scores) {
            if (score > bestScore) {
                bestScore = score;
                bestType = type;
            }
        }
        return { type: bestType, confidence: Math.round(bestScore * 1000) / 1000 };
    }
    extractNumeric(text) {
        for (const pattern of NUMERIC_PATTERNS) {
            const regex = new RegExp(pattern.source, pattern.flags);
            const match = regex.exec(text);
            if (match) {
                const valueStr = match[1].replace(/,/g, "").trim();
                const value = parseFloat(valueStr.replace(/%$/, ""));
                if (!isNaN(value)) {
                    return {
                        value,
                        unit: this.detectUnit(match[0]),
                        context: this.getContext(text, match.index, match.index + match[0].length),
                        position: match.index,
                        originalText: match[0].trim(),
                    };
                }
            }
        }
        return null;
    }
    extractDates(text) {
        const dates = [];
        for (const pattern of DATE_PATTERNS) {
            const regex = new RegExp(pattern.source, "g");
            let match;
            while ((match = regex.exec(text)) !== null) {
                const dateStr = match[1].trim();
                if (!dates.includes(dateStr)) {
                    dates.push(dateStr);
                }
            }
        }
        return dates;
    }
    detectUnit(text) {
        const lower = text.toLowerCase();
        for (const [key, val] of Object.entries(UNIT_MAP)) {
            if (lower.includes(key))
                return val;
        }
        return "";
    }
    getContext(text, start, end, window = 80) {
        const ctxStart = Math.max(0, start - window);
        const ctxEnd = Math.min(text.length, end + window);
        return text.slice(ctxStart, ctxEnd);
    }
    splitSentences(text) {
        return text.split(SENTENCE_SPLIT).map((s) => s.trim()).filter(Boolean);
    }
}
export function extractClaims(text, sourceUrl, sourceTitle) {
    const extractor = new ClaimExtractor();
    return extractor.extractClaims(text, sourceUrl, sourceTitle);
}
export function extractNumericClaims(text) {
    const extractor = new ClaimExtractor();
    return extractor.extractNumericClaims(text);
}
//# sourceMappingURL=claim_extractor.js.map