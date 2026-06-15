export type BenchmarkCategory = "factuality" | "completeness" | "citation" | "reasoning" | "multi_agent";

export interface BenchmarkTask {
  id: string;
  name: string;
  category: BenchmarkCategory;
  description: string;
  input: {
    topic: string;
    expectedFacts: string[];
    expectedSources: string[];
    minSections: number;
    minCitations: number;
  };
  scoring: {
    factualityWeight: number;
    completenessWeight: number;
    citationWeight: number;
    reasoningWeight: number;
    threshold: number;
  };
}

export interface BenchmarkScore {
  factuality: number;
  completeness: number;
  citation: number;
  reasoning: number;
  overall: number;
}

export interface BenchmarkResult {
  taskId: string;
  taskName: string;
  category: BenchmarkCategory;
  scores: BenchmarkScore;
  metrics: {
    durationMs: number;
    tokenCount: number;
    sourceCount: number;
    claimCount: number;
  };
  passed: boolean;
  errors: string[];
}

export interface BenchmarkReport {
  timestamp: Date;
  version: string;
  totalTasks: number;
  passedTasks: number;
  passRate: number;
  averageScores: BenchmarkScore;
  categoryBreakdown: Record<BenchmarkCategory, {
    count: number;
    passed: number;
    avgScore: number;
  }>;
  results: BenchmarkResult[];
}

export interface ComparisonReport {
  baseline: BenchmarkReport;
  current: BenchmarkReport;
  delta: {
    passRate: number;
    avgScore: number;
    regressionTasks: string[];
    improvedTasks: string[];
  };
}
