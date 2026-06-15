import type { BenchmarkTask } from "../types.js";

export const completenessTasks: BenchmarkTask[] = [
  {
    id: "completeness_basic",
    name: "Basic Coverage Completeness",
    category: "completeness",
    description: "Check topic coverage breadth",
    input: {
      topic: "Machine Learning overview",
      expectedFacts: ["supervised learning", "unsupervised learning", "reinforcement learning", "neural networks"],
      expectedSources: ["wikipedia.org"],
      minSections: 4,
      minCitations: 3,
    },
    scoring: {
      factualityWeight: 0.3,
      completenessWeight: 0.4,
      citationWeight: 0.2,
      reasoningWeight: 0.1,
      threshold: 0.5,
    },
  },
  {
    id: "completeness_cross_domain",
    name: "Cross-Domain Source Coverage",
    category: "completeness",
    description: "Ensure sources from multiple domains",
    input: {
      topic: "Climate change impacts 2026",
      expectedFacts: ["global temperature rise", "sea level rise", "extreme weather"],
      expectedSources: ["climate.gov", "who.int", "un.org"],
      minSections: 3,
      minCitations: 3,
    },
    scoring: {
      factualityWeight: 0.3,
      completenessWeight: 0.4,
      citationWeight: 0.2,
      reasoningWeight: 0.1,
      threshold: 0.5,
    },
  },
];
