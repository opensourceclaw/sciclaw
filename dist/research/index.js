/**
 * Research module - Deep research orchestration
 *
 * Copyright 2026 OpenClaw
 * Licensed under the Apache License, Version 2.0
 */
import { v4 as uuidv4 } from "uuid";
import { search, extractContent, OpenClawModelAdapter } from "@deepclaw/core";
// Export planner module
export { ResearchPlanner, createPlan } from "./planner.js";
// Export search module
export { ResearchSearchEngine, researchSearch, } from "./search.js";
// Export synthesizer module
export { ResearchSynthesizer, ReportFormatter, synthesize, } from "./synthesizer.js";
// Export synthesizer V2 module
export { LLMSynthesizer, createFinding, synthesizeFindings, } from "./synthesizer_v2.js";
// Export smart sectioning module
export { SmartSectioner, smartSectioner, } from "./smart_sectioning.js";
// Export report generator module
export { ReportGenerator, generateReport as generateSynthesisReport, } from "./report_generator.js";
// Export runner module
export { ResearchRunner, runResearch, } from "./runner.js";
/**
 * Conduct research on a topic (main entry point)
 */
export async function conductResearch(options) {
    const id = uuidv4();
    const depth = options.depth ?? "medium";
    // Step 1: Search for sources
    const searchResults = await search({
        query: options.topic,
        maxResults: depth === "shallow" ? 10 : depth === "medium" ? 20 : 50,
    });
    // Step 2: Extract content from top sources
    const contents = await Promise.all(searchResults.slice(0, 10).map(async (r) => {
        try {
            const content = await extractContent(r.url);
            return { ...r, content };
        }
        catch {
            return { ...r, content: r.snippet };
        }
    }));
    // Step 3: Synthesize research via OpenClaw Gateway
    let summary;
    try {
        const model = new OpenClawModelAdapter();
        const synthesis = await model.chat({
            task: "summarization",
            messages: [
                {
                    role: "system",
                    content: "You are a research synthesizer. Summarize the key findings from the provided sources on the given topic. Be concise and factual.",
                },
                {
                    role: "user",
                    content: `Topic: ${options.topic}\n\nSources:\n${contents
                        .map((c) => `- ${c.title}: ${c.content.slice(0, 500)}`)
                        .join("\n")}`,
                },
            ],
        });
        summary = synthesis.content || fallbackSummary(options.topic, contents);
    }
    catch {
        summary = fallbackSummary(options.topic, contents);
    }
    // Step 4: Build sections
    const sections = [
        {
            title: "Overview",
            content: summary,
            sources: contents.slice(0, 5).map(toCitation),
        },
    ];
    const sources = contents.map(toCitation);
    return {
        id,
        topic: options.topic,
        summary,
        sections,
        sources,
        createdAt: new Date(),
    };
}
/**
 * Generate fallback summary when LLM is unavailable
 */
function fallbackSummary(topic, contents) {
    const items = contents
        .slice(0, 5)
        .map((c) => `- ${c.title}: ${(c.content || c.snippet || "").slice(0, 200)}`)
        .join("\n");
    return `# Research: ${topic}\n\n## Key Sources\n\n${items}\n\n*Synthesis unavailable — OpenClaw Gateway not reachable.*`;
}
/**
 * Convert search result to citation
 */
function toCitation(result) {
    return {
        title: result.title,
        url: result.url,
        accessedAt: new Date(),
    };
}
export { conductResearch as default };
//# sourceMappingURL=index.js.map