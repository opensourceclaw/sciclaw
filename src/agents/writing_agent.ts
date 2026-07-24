import { BaseAgent } from "./base_agent.js";
import type { AgentConfig, AgentTask, AgentResult } from "./types.js";
import { AgentRole } from "./types.js";
import { CitationStyle } from "@deepclaw/core";

export class WritingAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig> & { role: AgentRole }) {
    super({
      role: AgentRole.WRITING,
      name: "WritingAgent",
      capabilities: ["report_generation", "citation_formatting"],
      maxRetries: 1,
      timeoutMs: 60000,
      ...config,
    });
  }

  async execute(task: AgentTask): Promise<AgentResult> {
    const input = task.input as {
      topic?: string;
      sources?: Array<{ url: string; title: string }>;
      format?: "markdown" | "html";
      citationStyle?: CitationStyle;
    } | undefined;
    const topic = input?.topic ?? "Untitled Research";
    const sources = input?.sources ?? [];

    const sections = [
      { title: "Abstract", content: `This report presents research findings on ${topic}.`, citations: [] },
      { title: "Introduction", content: `Background and context for ${topic}.`, citations: [] },
      { title: "Main Findings", content: `Synthesized findings about ${topic}.`, citations: sources.map((s) => s.url) },
      { title: "Source Analysis", content: "Source quality assessment.", citations: [] },
      { title: "Conclusion", content: `Summary of key takeaways on ${topic}.`, citations: [] },
    ];

    const report = this.buildReport(topic, sections, input?.format ?? "markdown");

    return {
      taskId: task.id,
      role: this.config.role,
      status: "success",
      output: {
        report,
        citations: sources.map((s, i) => ({
          url: s.url,
          title: s.title,
          sourceId: `src_${i}`,
          domain: "",
          accessedDate: new Date(),
          qualityScore: 0.5,
          relevantSnippet: "",
          metadata: {},
        })),
        sections,
        format: input?.format ?? "markdown",
        wordCount: report.split(/\s+/).length,
      },
      artifacts: [],
      metrics: { durationMs: 0 },
      errors: [],
    };
  }

  private buildReport(topic: string, sections: Array<{ title: string; content: string; citations: string[] }>, format: string): string {
    const lines: string[] = [`# ${topic}`, ""];
    for (const section of sections) {
      lines.push(`## ${section.title}`, "", section.content, "");
      if (section.citations.length > 0) {
        lines.push(`*Sources: ${section.citations.join(", ")}*`, "");
      }
    }
    lines.push("## References", "");
    return lines.join("\n");
  }
}

export function createWritingAgent(): WritingAgent {
  return new WritingAgent();
}
