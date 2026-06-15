export const reasoningTasks = [
    {
        id: "reasoning_single_hop",
        name: "Single-Hop Reasoning",
        category: "reasoning",
        description: "Verify single-hop reasoning chain",
        input: {
            topic: "Relationship between exercise and heart health",
            expectedFacts: ["exercise strengthens heart", "reduces cardiovascular risk"],
            expectedSources: ["who.int", "nih.gov"],
            minSections: 2,
            minCitations: 2,
        },
        scoring: {
            factualityWeight: 0.3,
            completenessWeight: 0.2,
            citationWeight: 0.2,
            reasoningWeight: 0.3,
            threshold: 0.5,
        },
    },
    {
        id: "reasoning_multi_hop",
        name: "Multi-Hop Reasoning",
        category: "reasoning",
        description: "Verify multi-hop reasoning (3+ steps)",
        input: {
            topic: "Impact of AI on healthcare diagnostics",
            expectedFacts: ["AI improves diagnostic accuracy", "reduces human error", "enables early detection"],
            expectedSources: ["nature.com", "who.int"],
            minSections: 3,
            minCitations: 3,
        },
        scoring: {
            factualityWeight: 0.2,
            completenessWeight: 0.2,
            citationWeight: 0.2,
            reasoningWeight: 0.4,
            threshold: 0.5,
        },
    },
];
//# sourceMappingURL=reasoning.js.map