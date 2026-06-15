import { BaseAgent } from "./base_agent.js";
import type { AgentConfig, AgentTask, AgentResult } from "./types.js";
import { AgentRole } from "./types.js";

export class SearchAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig> & { role: AgentRole }) {
    super({
      role: AgentRole.SEARCH,
      name: "SearchAgent",
      capabilities: ["web_search", "content_extraction", "source_scoring"],
      maxRetries: 2,
      timeoutMs: 60000,
      ...config,
    });
  }

  async execute(task: AgentTask): Promise<AgentResult> {
    const input = task.input as { queries?: string[]; maxResultsPerQuery?: number; engines?: string[] } | undefined;
    const queries = input?.queries ?? [];

    if (queries.length === 0) {
      return {
        taskId: task.id,
        role: this.config.role,
        status: "failed",
        output: null,
        artifacts: [],
        metrics: { durationMs: 0 },
        errors: ["Empty queries"],
      };
    }

    const results = queries.map((q, i) => ({
      url: `https://example.com/result-${i}`,
      title: `Result for: ${q}`,
      snippet: `Information about ${q}`,
      content: `Content about ${q}. This is simulated search content.`,
      domainScore: { domain: "example.com", reputation: 0.5, category: "unknown" },
      freshnessScore: { score: 0.5, daysSincePublished: 0, category: "unknown" },
      sourceScore: 0.5,
    }));

    const deduped = results.filter((r, i, arr) => arr.findIndex((x) => x.url === r.url) === i);

    return {
      taskId: task.id,
      role: this.config.role,
      status: "success",
      output: {
        sources: deduped,
        extractedContent: [],
        metadata: { totalSources: deduped.length, totalQueries: queries.length, durationMs: 0 },
      },
      artifacts: [],
      metrics: { durationMs: 0, toolCalls: queries.length },
      errors: [],
    };
  }
}

export function createSearchAgent(): SearchAgent {
  return new SearchAgent();
}
