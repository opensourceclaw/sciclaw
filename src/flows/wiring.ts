/**
 * SciClaw v4.0.0 — flow wiring helpers (GA-A2).
 *
 * Shared real-path wiring for DeepResearchFlow / AutoResearchFlow: search runs
 * through core/search (real engines; offline tests inject fixture sources via
 * `registerSearchSource`), synthesis uses the core LLM when configured and an
 * honest extractive fallback otherwise. Synthetic data only in explicit mock
 * mode (CLI `--mock`) — never silently (GA-A2 red line: failures are explicit).
 */

import { search, LLMEngine } from "../core/index.js";
import type { SearchEngine } from "../core/index.js";
import type { SubQuery, ResearchSearchResult } from "../orchestrator/types.js";

export interface FlowLLMConfig {
  provider?: string;
  apiKey?: string;
  model?: string;
}

export interface FlowSynthesis {
  summary: string;
  keyInsights: string[];
  openQuestions: string[];
  synthesisMode: "llm" | "extractive";
}

export interface FlowSearchSet {
  query: string;
  results: ResearchSearchResult[];
  timestamp: number;
}

/**
 * Synthetic mock results — explicitly labeled (`source: "mock"`, reserved
 * `.invalid` URLs) and only produced when mock mode is on.
 */
export function mockSearchResults(query: string, limit: number = 5): ResearchSearchResult[] {
  const results: ResearchSearchResult[] = [];
  for (let i = 0; i < Math.min(limit, 5); i++) {
    results.push({
      title: `Mock result ${i + 1} for ${query}`,
      url: `https://mock.invalid/${i + 1}`,
      snippet: `Synthetic mock snippet for "${query}" — no real search was performed.`,
      source: "mock",
      rank: i + 1,
    });
  }
  return results;
}

/** Run each sub-query through core/search (or mock mode) and map to research results. */
export async function searchSubQueries(
  subQueries: SubQuery[],
  opts: { maxQueries: number; maxResults: number; mock?: boolean }
): Promise<FlowSearchSet[]> {
  const sets: FlowSearchSet[] = [];
  for (const sq of subQueries.slice(0, opts.maxQueries)) {
    let results: ResearchSearchResult[];
    if (opts.mock) {
      results = mockSearchResults(sq.query, opts.maxResults);
    } else {
      const engines = (sq.sources.length ? sq.sources : undefined) as SearchEngine[] | undefined;
      const found = await search({ query: sq.query, maxResults: opts.maxResults, engines });
      results = found.map((r, i) => ({
        title: r.title,
        url: r.url,
        snippet: r.snippet,
        source: r.source,
        rank: r.rank ?? i + 1,
      }));
    }
    sets.push({ query: sq.query, results, timestamp: Date.now() });
  }
  return sets;
}

/** Resolve LLM settings from explicit config or environment; null = LLM unavailable. */
export function resolveLLMConfig(config?: FlowLLMConfig): FlowLLMConfig | null {
  const provider = config?.provider ?? process.env.DEEPCLAW_LLM_PROVIDER;
  const apiKey = config?.apiKey ?? process.env.DEEPCLAW_LLM_API_KEY;
  if (!provider || !apiKey) return null;
  return { provider, apiKey, model: config?.model };
}

function extractSentences(results: ResearchSearchResult[], max: number = 5): string[] {
  const out: string[] = [];
  for (const r of results) {
    for (const raw of r.snippet.split(/(?<=[.!?])\s+/)) {
      const sentence = raw.trim();
      if (sentence.length >= 30) out.push(sentence);
      if (out.length >= max) return out;
    }
  }
  return out;
}

/** Deterministic, source-derived synthesis — used when no LLM is configured. */
export function extractiveSynthesis(
  query: string,
  results: ResearchSearchResult[]
): Omit<FlowSynthesis, "synthesisMode"> {
  const top = results.slice(0, 3).map((r) => `${r.title} — ${r.snippet}`);
  const summary =
    results.length === 0
      ? `No search results were collected for "${query}" — nothing to synthesize (extractive mode).`
      : `Synthesis for "${query}" from ${results.length} source(s) (extractive — no LLM configured):\n\n` +
        top.join("\n");
  return { summary, keyInsights: extractSentences(results), openQuestions: [] };
}

const SYNTHESIS_SYSTEM_PROMPT =
  "You are SciClaw's research synthesizer. Synthesize strictly from the provided search results — " +
  "never invent facts or sources. Answer as JSON: {\"summary\": string, \"keyInsights\": string[], \"openQuestions\": string[]}.";

function buildSynthesisPrompt(query: string, results: ResearchSearchResult[]): string {
  const lines = results.slice(0, 12).map(
    (r, i) => `${i + 1}. ${r.title}\n   URL: ${r.url}\n   ${r.snippet.slice(0, 400)}`
  );
  return `Research query: ${query}\n\nSearch results:\n${lines.join("\n")}\n\nSynthesize.`;
}

function parseSynthesis(text: string): Omit<FlowSynthesis, "synthesisMode"> {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as {
        summary?: unknown;
        keyInsights?: unknown;
        openQuestions?: unknown;
      };
      return {
        summary: typeof parsed.summary === "string" ? parsed.summary : text.trim(),
        keyInsights: Array.isArray(parsed.keyInsights)
          ? parsed.keyInsights.filter((s): s is string => typeof s === "string")
          : [],
        openQuestions: Array.isArray(parsed.openQuestions)
          ? parsed.openQuestions.filter((s): s is string => typeof s === "string")
          : [],
      };
    } catch {
      // fall through to plain-text handling
    }
  }
  return { summary: text.trim(), keyInsights: [], openQuestions: [] };
}

/**
 * Synthesize from real results: core LLM when configured (errors propagate —
 * no silent downgrade), deterministic extractive synthesis otherwise.
 */
export async function synthesizeResults(
  query: string,
  results: ResearchSearchResult[],
  llmConfig?: FlowLLMConfig
): Promise<FlowSynthesis> {
  const resolved = resolveLLMConfig(llmConfig);
  if (!resolved) {
    return { ...extractiveSynthesis(query, results), synthesisMode: "extractive" };
  }
  const engine = new LLMEngine({
    provider: resolved.provider,
    apiKey: resolved.apiKey,
    model: resolved.model,
  });
  const text = await engine.chatSimple(buildSynthesisPrompt(query, results), SYNTHESIS_SYSTEM_PROMPT);
  return { ...parseSynthesis(text), synthesisMode: "llm" };
}
