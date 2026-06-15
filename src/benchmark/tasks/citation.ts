import type { BenchmarkTask } from "../types.js";

export const citationTasks: BenchmarkTask[] = [
  {
    id: "citation_apa",
    name: "APA Citation Formatting",
    category: "citation",
    description: "Verify APA 7th edition citation format",
    input: {
      topic: "Any research topic",
      expectedFacts: [],
      expectedSources: [],
      minSections: 2,
      minCitations: 2,
    },
    scoring: {
      factualityWeight: 0.1,
      completenessWeight: 0.1,
      citationWeight: 0.7,
      reasoningWeight: 0.1,
      threshold: 0.6,
    },
  },
  {
    id: "citation_mla",
    name: "MLA Citation Formatting",
    category: "citation",
    description: "Verify MLA 9th edition citation format",
    input: {
      topic: "Any research topic",
      expectedFacts: [],
      expectedSources: [],
      minSections: 2,
      minCitations: 2,
    },
    scoring: {
      factualityWeight: 0.1,
      completenessWeight: 0.1,
      citationWeight: 0.7,
      reasoningWeight: 0.1,
      threshold: 0.6,
    },
  },
  {
    id: "citation_chicago",
    name: "Chicago Citation Formatting",
    category: "citation",
    description: "Verify Chicago 17th edition citation format",
    input: {
      topic: "Any research topic",
      expectedFacts: [],
      expectedSources: [],
      minSections: 2,
      minCitations: 2,
    },
    scoring: {
      factualityWeight: 0.1,
      completenessWeight: 0.1,
      citationWeight: 0.7,
      reasoningWeight: 0.1,
      threshold: 0.6,
    },
  },
];
