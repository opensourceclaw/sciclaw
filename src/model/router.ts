import { DEFAULT_TASK_MODEL_MAP } from "./types.js";
import type { TaskCategory, ModelRequest, ModelResponse, ModelAdapterConfig } from "./types.js";
import type { OpenClawModelAdapter } from "./adapter.js";
import { FallbackHandler } from "./fallback.js";
import { CostOptimizer } from "./cost.js";

export interface RouterConfig {
  budgetLimitUSD?: number;
  preferCheapest?: boolean;
}

export class ModelRouter {
  private fallback: FallbackHandler;
  private costOptimizer: CostOptimizer;

  constructor(
    private adapter: OpenClawModelAdapter,
    private config?: RouterConfig,
  ) {
    this.fallback = new FallbackHandler(adapter);
    this.costOptimizer = new CostOptimizer(config?.budgetLimitUSD);
  }

  async route(request: ModelRequest): Promise<ModelResponse> {
    const task = request.task ?? "default";
    let model = this.getRecommendedModel(task);

    // If prefer cheapest, override with cost-optimized selection
    if (this.config?.preferCheapest) {
      const estimatedTokens = this.estimateInputTokens(request);
      model = this.costOptimizer.recommendCheapest(task, estimatedTokens);
    }

    // Check budget
    if (this.config?.budgetLimitUSD !== undefined) {
      const estimatedTokens = this.estimateInputTokens(request);
      if (!this.costOptimizer.isWithinBudget(model, estimatedTokens)) {
        model = this.costOptimizer.recommendCheapest(task, estimatedTokens);
      }
    }

    return this.fallback.execute(request, model);
  }

  getRecommendedModel(task: TaskCategory): string {
    return DEFAULT_TASK_MODEL_MAP[task] ?? DEFAULT_TASK_MODEL_MAP["default"]!;
  }

  getFallbackHandler(): FallbackHandler {
    return this.fallback;
  }

  getCostOptimizer(): CostOptimizer {
    return this.costOptimizer;
  }

  private estimateInputTokens(request: ModelRequest): number {
    let total = 0;
    for (const msg of request.messages) {
      total += msg.content.length;
    }
    return Math.ceil(total / 4); // rough char→token estimate
  }
}
