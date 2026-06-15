import { BaseAgent } from "./base_agent.js";
import { AgentRole } from "./types.js";
export class WritingAgent extends BaseAgent {
    constructor(config) {
        super({
            role: AgentRole.WRITING,
            name: "WritingAgent",
            capabilities: ["report_generation", "citation_formatting"],
            maxRetries: 1,
            timeoutMs: 60000,
            ...config,
        });
    }
    async execute(task) {
        const input = task.input;
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
    buildReport(topic, sections, format) {
        const lines = [`# ${topic}`, ""];
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
export function createWritingAgent() {
    return new WritingAgent();
}
//# sourceMappingURL=writing_agent.js.map