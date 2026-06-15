export const multiAgentTasks = [
    {
        id: "multi_agent_collab",
        name: "Multi-Agent Collaboration",
        category: "multi_agent",
        description: "End-to-end 4-agent collaboration",
        input: {
            topic: "Quantum computing applications in cryptography",
            expectedFacts: ["Shor's algorithm", "quantum key distribution", "post-quantum cryptography"],
            expectedSources: ["arxiv.org", "ieee.org"],
            minSections: 4,
            minCitations: 3,
        },
        scoring: {
            factualityWeight: 0.25,
            completenessWeight: 0.25,
            citationWeight: 0.25,
            reasoningWeight: 0.25,
            threshold: 0.5,
        },
    },
    {
        id: "multi_agent_error_recovery",
        name: "Multi-Agent Error Recovery",
        category: "multi_agent",
        description: "Agent failure and recovery during execution",
        input: {
            topic: "Renewable energy trends",
            expectedFacts: ["solar", "wind", "hydroelectric"],
            expectedSources: ["iea.org", "energy.gov"],
            minSections: 3,
            minCitations: 2,
        },
        scoring: {
            factualityWeight: 0.25,
            completenessWeight: 0.25,
            citationWeight: 0.25,
            reasoningWeight: 0.25,
            threshold: 0.4,
        },
    },
];
//# sourceMappingURL=multi_agent.js.map