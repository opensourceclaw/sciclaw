/**
 * SciClaw v3.0.0 — Adaptive Query Engine
 *
 * Context-aware query generation with template-based approach.
 * Target latency: < 500ms (no LLM calls).
 */
import { QueryType, DEFAULT_INTERACTIVE_CONFIG } from "./types.js";
import type {
  AdaptiveQuery,
  SessionContext,
  InteractionTurn,
  QueryResponse,
  InteractiveConfig,
} from "./types.js";

// ── Helpers ──────────────────────────────────────────────────────────────

function generateId(): string {
  return crypto.randomUUID();
}

function jaccardSimilarity(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

// ── Query Templates ──────────────────────────────────────────────────────

const CLARIFICATION_TEMPLATES = [
  "What specifically about {focus} interests you?",
  "Can you clarify what you mean by {focus}?",
  "Which aspect of {focus} is most important?",
];

const DIRECTION_TEMPLATES = [
  "Should we explore {topic} further or change direction?",
  "Would you like to focus on {focus} or explore something else?",
  "Which area should we prioritize: {focus}?",
];

const DEPTH_TEMPLATES = [
  "Would you like a deeper analysis of {focus}?",
  "Should we dive deeper into {focus}?",
  "Ready to explore {focus} in more detail?",
];

const VALIDATION_TEMPLATES = [
  "Does this finding align with your understanding of {topic}?",
  "How accurate does this analysis of {focus} seem?",
  "Can you validate this conclusion about {focus}?",
];

const PREFERENCE_TEMPLATES = [
  "Do you prefer detailed reports or concise summaries?",
  "Would you like more data visualizations or text analysis?",
  "Do you prefer academic or business language style?",
];

function pickTemplate(templates: string[], context: SessionContext): string {
  const idx = context.depth % templates.length;
  return templates[idx] ?? templates[0] ?? "";
}

function fillTemplate(
  template: string,
  context: SessionContext,
): string {
  const focus = context.focus[0] ?? context.topic;
  return template
    .replace(/\{focus\}/g, focus)
    .replace(/\{topic\}/g, context.topic);
}

function scoreQuery(
  query: AdaptiveQuery,
  context: SessionContext,
  history: InteractionTurn[],
): number {
  let score = 0;

  // Relevance: check if query relates to current focus
  const focusMatch = context.focus.some((f) =>
    query.question.toLowerCase().includes(f.toLowerCase()),
  );
  score += focusMatch ? 40 : 10;

  // Information gain: prioritize unexplored areas
  const isExplored = context.exploredTopics.some((t) =>
    query.question.includes(t),
  );
  score += isExplored ? 5 : 30;

  // Preference alignment
  const prefMatch = context.preferences.filter((p) =>
    query.question.toLowerCase().includes(p.key.toLowerCase()),
  ).length;
  score += Math.min(prefMatch * 10, 20);

  // Diversity from recent queries
  const recentQuestions = history
    .slice(-3)
    .filter((t) => t.systemMessage)
    .map((t) => t.systemMessage!.content);
  const maxSimilarity = recentQuestions.reduce((max, q) => {
    const s = jaccardSimilarity(
      query.question.toLowerCase().split(/\s+/),
      q.toLowerCase().split(/\s+/),
    );
    return Math.max(max, s);
  }, 0);
  score += (1 - maxSimilarity) * 10;

  return score;
}

// ── AdaptiveQueryEngine ──────────────────────────────────────────────────

export class AdaptiveQueryEngine {
  private config: InteractiveConfig;
  private totalGenerated = 0;
  private totalPrioritySum = 0;

  constructor(config?: Partial<InteractiveConfig>) {
    this.config = { ...DEFAULT_INTERACTIVE_CONFIG, ...config };
    if (this.config.adaptiveQueryMaxPerTurn < 1)
      this.config.adaptiveQueryMaxPerTurn = 1;
    if (this.config.adaptiveQueryMaxPerTurn > 10)
      this.config.adaptiveQueryMaxPerTurn = 10;
  }

  generateQueries(
    context: SessionContext,
    history: InteractionTurn[],
  ): AdaptiveQuery[] {
    const candidates: AdaptiveQuery[] = [];

    // Determine which query types to generate
    if (context.confidence < 0.3) {
      candidates.push(
        ...this.getClarificationQueries(context),
      );
    }
    if (context.focus.length === 0 || context.confidence < 0.5) {
      candidates.push(...this.getDirectionQueries(context));
    }
    if (context.depth < 3 && context.confidence > 0.5) {
      candidates.push(...this.getDepthQueries(context));
    }
    if (context.confidence > 0.6 && context.depth >= 2) {
      candidates.push(...this.getValidationQueries(context));
    }
    // Always add one preference query
    candidates.push(...this._getPreferenceQueries(context).slice(0, 1));

    // Score and sort
    const scored = candidates.map((q) => ({
      query: q,
      score: scoreQuery(q, context, history),
    }));
    scored.sort((a, b) => b.score - a.score);

    // Select top N
    const selected = scored
      .slice(0, this.config.adaptiveQueryMaxPerTurn)
      .map((s) => {
        s.query.priority = Math.round(s.score / 10);
        return s.query;
      });

    this.totalGenerated += selected.length;
    this.totalPrioritySum += selected.reduce((s, q) => s + q.priority, 0);
    return selected;
  }

  prioritizeQueries(queries: AdaptiveQuery[]): AdaptiveQuery[] {
    return [...queries].sort((a, b) => b.priority - a.priority);
  }

  adaptFromFeedback(
    queries: AdaptiveQuery[],
    feedback: QueryResponse[],
  ): AdaptiveQuery[] {
    const feedbackMap = new Map(feedback.map((f) => [f.queryId, f]));

    const adapted = queries
      .map((q) => {
        const fb = feedbackMap.get(q.id);
        if (!fb) return q;

        // Reduce priority for rejected/skipped queries
        if (
          fb.action === "reject" ||
          fb.action === "skip" ||
          fb.answer.toLowerCase().includes("no")
        ) {
          return { ...q, priority: Math.max(0, q.priority - 3) };
        }
        // Increase priority for accepted queries
        if (
          fb.action === "accept" ||
          fb.action === "refine" ||
          fb.answer.toLowerCase().includes("yes")
        ) {
          return { ...q, priority: Math.min(10, q.priority + 2) };
        }
        return q;
      })
      .filter((q) => q.priority > 0);

    return adapted;
  }

  getClarificationQueries(context: SessionContext): AdaptiveQuery[] {
    return CLARIFICATION_TEMPLATES.map((t, i) => ({
      id: generateId(),
      type: QueryType.CLARIFICATION,
      question: fillTemplate(t, context),
      context: "Low confidence requires clarification",
      priority: 8,
      options: i === 0 ? ["Yes", "No", "Partially"] : undefined,
      expectedResponseType: i === 0 ? "choice" as const : "text" as const,
      generatedAt: new Date(),
    }));
  }

  getDirectionQueries(context: SessionContext): AdaptiveQuery[] {
    return DIRECTION_TEMPLATES.map((t) => ({
      id: generateId(),
      type: QueryType.DIRECTION,
      question: fillTemplate(t, context),
      context: "Exploring research direction options",
      priority: 7,
      expectedResponseType: "text" as const,
      generatedAt: new Date(),
    }));
  }

  getDepthQueries(context: SessionContext): AdaptiveQuery[] {
    return DEPTH_TEMPLATES.map((t) => ({
      id: generateId(),
      type: QueryType.DEPTH,
      question: fillTemplate(t, context),
      context: "Determining research depth preference",
      priority: 6,
      expectedResponseType: "choice" as const,
      options: ["Yes, go deeper", "Stay at current level", "Go broader"],
      generatedAt: new Date(),
    }));
  }

  getValidationQueries(context: SessionContext): AdaptiveQuery[] {
    return VALIDATION_TEMPLATES.map((t) => ({
      id: generateId(),
      type: QueryType.VALIDATION,
      question: fillTemplate(t, context),
      context: "Validating research findings with user",
      priority: 5,
      expectedResponseType: "choice" as const,
      options: ["Accurate", "Partially accurate", "Not accurate"],
      generatedAt: new Date(),
    }));
  }

  private _getPreferenceQueries(context: SessionContext): AdaptiveQuery[] {
    return PREFERENCE_TEMPLATES.map((t) => ({
      id: generateId(),
      type: QueryType.PREFERENCE,
      question: fillTemplate(t, context),
      context: "Learning user preferences",
      priority: 3,
      expectedResponseType: "choice" as const,
      options: ["Option A", "Option B"],
      generatedAt: new Date(),
    }));
  }

  getQueryStats(): { totalGenerated: number; avgPriority: number } {
    return {
      totalGenerated: this.totalGenerated,
      avgPriority:
        this.totalGenerated > 0
          ? Math.round((this.totalPrioritySum / this.totalGenerated) * 10) / 10
          : 0,
    };
  }
}

export function createAdaptiveQueryEngine(
  config?: Partial<InteractiveConfig>,
): AdaptiveQueryEngine {
  return new AdaptiveQueryEngine(config);
}
