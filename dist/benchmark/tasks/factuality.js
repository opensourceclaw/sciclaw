export const factualityTasks = [
    {
        id: "factuality_basic",
        name: "Basic Factual Accuracy",
        category: "factuality",
        description: "Verify basic factual claims about well-known topics",
        input: {
            topic: "Speed of light in vacuum",
            expectedFacts: ["299,792,458 meters per second", "~300,000 km/s", "constant in vacuum"],
            expectedSources: ["wikipedia.org", "nist.gov"],
            minSections: 3,
            minCitations: 2,
        },
        scoring: {
            factualityWeight: 0.5,
            completenessWeight: 0.2,
            citationWeight: 0.2,
            reasoningWeight: 0.1,
            threshold: 0.6,
        },
    },
    {
        id: "factuality_numeric",
        name: "Numeric Factual Accuracy",
        category: "factuality",
        description: "Verify numeric claims with tolerance",
        input: {
            topic: "Earth circumference at equator",
            expectedFacts: ["40,075 km", "24,901 miles", "~40,000 km"],
            expectedSources: ["nasa.gov", "britannica.com"],
            minSections: 2,
            minCitations: 2,
        },
        scoring: {
            factualityWeight: 0.6,
            completenessWeight: 0.1,
            citationWeight: 0.2,
            reasoningWeight: 0.1,
            threshold: 0.5,
        },
    },
    {
        id: "factuality_quotation",
        name: "Quotation Verification",
        category: "factuality",
        description: "Verify quoted statements are attributed correctly",
        input: {
            topic: "Einstein's quote about imagination",
            expectedFacts: ["imagination is more important than knowledge", "Albert Einstein"],
            expectedSources: ["wikiquote.org"],
            minSections: 2,
            minCitations: 1,
        },
        scoring: {
            factualityWeight: 0.5,
            completenessWeight: 0.2,
            citationWeight: 0.2,
            reasoningWeight: 0.1,
            threshold: 0.5,
        },
    },
];
//# sourceMappingURL=factuality.js.map