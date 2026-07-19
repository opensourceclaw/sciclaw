export const DEFAULT_CROSS_DOMAIN_CONFIG = {
    minOverlap: 0.15,
    maxConnections: 20,
    minConfidence: 0.4,
};
// ── Connection type keywords ─────────────────────────────────────────
const CONNECTION_PATTERNS = [
    {
        type: "causation",
        patterns: [
            /\b(?:cause|lead to|result in|trigger|drive|due to|because)\b/i,
        ],
    },
    {
        type: "correlation",
        patterns: [
            /\b(?:correlat|associat|relat|link|tied to|connected)\b/i,
        ],
    },
    {
        type: "analogy",
        patterns: [
            /\b(?:similar to|analogous|like|resemble|parallel|mirror)\b/i,
        ],
    },
    {
        type: "implication",
        patterns: [
            /\b(?:implies|suggests|indicates|points to|means|entails)\b/i,
        ],
    },
];
// ── CrossDomainSynthesizer ───────────────────────────────────────────
export class CrossDomainSynthesizer {
    config;
    constructor(config) {
        this.config = { ...DEFAULT_CROSS_DOMAIN_CONFIG, ...config };
    }
    /**
     * Synthesize cross-domain connections and insights from multiple
     * domain evidence sets.
     */
    synthesize(evidence) {
        const domains = evidence.map((e) => e.domain);
        if (evidence.length < 2) {
            return { domains, connections: [], insights: [], confidence: 0 };
        }
        const connections = this._findConnections(evidence);
        const insights = this._extractInsights(evidence, connections);
        const confidence = this._computeOverallConfidence(connections, insights);
        return { domains, connections, insights, confidence };
    }
    // ── Private ──────────────────────────────────────────────────────────
    _findConnections(evidence) {
        const connections = [];
        for (let i = 0; i < evidence.length; i++) {
            for (let j = i + 1; j < evidence.length; j++) {
                const conn = this._connectPair(evidence[i], evidence[j]);
                if (conn)
                    connections.push(conn);
            }
        }
        return connections
            .filter((c) => c.strength >= this.config.minOverlap)
            .sort((a, b) => b.strength - a.strength)
            .slice(0, this.config.maxConnections);
    }
    _connectPair(a, b) {
        const evidence = [];
        // Shared key terms
        const sharedTerms = a.keyTerms.filter((t) => b.keyTerms.some((u) => u.toLowerCase() === t.toLowerCase()) &&
            t.length >= 3);
        if (sharedTerms.length > 0) {
            evidence.push(`Shared terms: ${sharedTerms.join(", ")}`);
        }
        // Text overlap between claims
        const aText = a.claims.join(" ").toLowerCase();
        const bText = b.claims.join(" ").toLowerCase();
        const aWords = new Set(aText.split(/\s+/).filter((w) => w.length > 3));
        const bWords = new Set(bText.split(/\s+/).filter((w) => w.length > 3));
        const overlap = [...aWords].filter((w) => bWords.has(w));
        // Strength: combined signal from term overlap and word overlap
        const termOverlap = sharedTerms.length / Math.max(a.keyTerms.length + b.keyTerms.length, 1);
        const wordOverlap = overlap.length / Math.max(aWords.size + bWords.size, 1);
        const strength = Math.min(1, termOverlap * 0.6 + wordOverlap * 0.4);
        if (strength < this.config.minOverlap && sharedTerms.length === 0) {
            return null;
        }
        // Detect connection type from claim text
        const combined = [...a.claims, ...b.claims].join(" ");
        const type = this._detectConnectionType(combined);
        if (overlap.length > 0) {
            evidence.push(`Concept overlap: ${overlap.slice(0, 5).join(", ")}`);
        }
        return {
            source: a.domain,
            target: b.domain,
            type,
            strength,
            evidence,
        };
    }
    _detectConnectionType(text) {
        for (const { type, patterns } of CONNECTION_PATTERNS) {
            if (patterns.some((p) => p.test(text)))
                return type;
        }
        return "correlation";
    }
    _extractInsights(evidence, connections) {
        const insights = [];
        let idCounter = 0;
        // Generate insights from strong connections
        for (let i = 0; i < connections.length; i++) {
            const conn = connections[i];
            if (conn.strength < this.config.minConfidence)
                continue;
            const srcEvidence = evidence.find((e) => e.domain === conn.source);
            const tgtEvidence = evidence.find((e) => e.domain === conn.target);
            const statement = this._buildInsightStatement(conn, srcEvidence, tgtEvidence);
            insights.push({
                id: `insight_${++idCounter}`,
                statement,
                domains: [conn.source, conn.target],
                confidence: conn.strength,
                supportingConnections: [String(i)],
            });
        }
        // Generate domain-spanning insights from shared terms across 3+ domains
        const allTerms = new Map();
        for (const e of evidence) {
            for (const term of e.keyTerms) {
                const t = term.toLowerCase();
                if (!allTerms.has(t))
                    allTerms.set(t, new Set());
                allTerms.get(t).add(e.domain);
            }
        }
        for (const [term, domainSet] of allTerms) {
            if (domainSet.size >= 3 && term.length >= 3) {
                const domains = [...domainSet];
                insights.push({
                    id: `insight_${++idCounter}`,
                    statement: `"${term}" appears across ${domains.length} domains (${domains.join(", ")}), suggesting a cross-cutting concept`,
                    domains,
                    confidence: Math.min(1, domainSet.size / evidence.length + 0.3),
                    supportingConnections: [],
                });
            }
        }
        return insights.sort((a, b) => b.confidence - a.confidence);
    }
    _buildInsightStatement(conn, src, tgt) {
        const srcName = src?.domain ?? conn.source;
        const tgtName = tgt?.domain ?? conn.target;
        const verbMap = {
            causation: "may influence",
            correlation: "is correlated with",
            analogy: "is analogous to",
            implication: "has implications for",
        };
        const verb = verbMap[conn.type];
        let statement = `Domain "${srcName}" ${verb} domain "${tgtName}"`;
        // Enrich with a key claim from each domain if available
        const srcClaim = src?.claims[0] ?? "";
        const tgtClaim = tgt?.claims[0] ?? "";
        if (srcClaim && tgtClaim) {
            statement += ` (e.g., "${srcClaim.slice(0, 80)}..." ↔ "${tgtClaim.slice(0, 80)}...")`;
        }
        return statement;
    }
    _computeOverallConfidence(connections, insights) {
        if (connections.length === 0 && insights.length === 0)
            return 0;
        const connAvg = connections.length > 0
            ? connections.reduce((s, c) => s + c.strength, 0) / connections.length
            : 0;
        const insightAvg = insights.length > 0
            ? insights.reduce((s, i) => s + i.confidence, 0) / insights.length
            : 0;
        return Math.round((connAvg * 0.5 + insightAvg * 0.5) * 100) / 100;
    }
}
/** Factory function for CrossDomainSynthesizer */
export function createCrossDomainSynthesizer(config) {
    return new CrossDomainSynthesizer(config);
}
//# sourceMappingURL=cross_domain_synthesizer.js.map