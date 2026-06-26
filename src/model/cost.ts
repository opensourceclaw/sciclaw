import type { ModelCostEntry, TaskCategory } from "./types.js";

const MODEL_COSTS: Record<string, ModelCostEntry> = {
  "anthropic/claude-opus-4-6":      { inputUSDPer1M: 15, outputUSDPer1M: 75 },
  "anthropic/claude-sonnet-4-6":    { inputUSDPer1M: 3,  outputUSDPer1M: 15 },
  "openai/o3-mini":                 { inputUSDPer1M: 1.1, outputUSDPer1M: 4.4 },
  "openai/gpt-4o":                  { inputUSDPer1M: 2.5, outputUSDPer1M: 10 },
  "google/gemini-3-flash-preview":  { inputUSDPer1M: 0.15, outputUSDPer1M: 0.6 },
  "google/gemini-3-pro-preview":    { inputUSDPer1M: 1.25, outputUSDPer1M: 5 },
  "deepseek/deepseek-v4-flash":     { inputUSDPer1M: 0.2, outputUSDPer1M: 0.5 },
};

// Economic ranking for each task: cheapest model first
const TASK_ECONOMY_RANKING: Partial<Record<TaskCategory, string[]>> = {
  summarization: ["google/gemini-3-flash-preview", "deepseek/deepseek-v4-flash", "openai/o3-mini"],
  coding: ["deepseek/deepseek-v4-flash", "anthropic/claude-sonnet-4-6"],
  default: ["google/gemini-3-flash-preview", "deepseek/deepseek-v4-flash", "anthropic/claude-sonnet-4-6"],
};

export class CostOptimizer {
  constructor(private budgetLimitUSD?: number) {}

  estimate(model: string, inputTokens: number, outputTokens: number): number {
    const cost = MODEL_COSTS[model];
    if (!cost) return 0;
    return (inputTokens / 1_000_000) * cost.inputUSDPer1M
         + (outputTokens / 1_000_000) * cost.outputUSDPer1M;
  }

  isWithinBudget(model: string, estimatedInputTokens: number): boolean {
    if (this.budgetLimitUSD === undefined) return true;
    const estimatedCost = this.estimate(model, estimatedInputTokens, estimatedInputTokens / 2);
    return estimatedCost <= this.budgetLimitUSD;
  }

  recommendCheapest(task: TaskCategory, inputTokens: number): string {
    const ranking = TASK_ECONOMY_RANKING[task] ?? TASK_ECONOMY_RANKING["default"]!;
    for (const model of ranking) {
      if (this.isWithinBudget(model, inputTokens)) {
        return model;
      }
    }
    return "deepseek/deepseek-v4-flash"; // fallback cheapest
  }

  getModelCosts(): Record<string, ModelCostEntry> {
    return { ...MODEL_COSTS };
  }
}
