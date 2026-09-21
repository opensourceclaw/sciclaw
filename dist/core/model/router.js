import { DEFAULT_TASK_MODEL_MAP } from "./types.js";
import { FallbackHandler } from "./fallback.js";
import { CostOptimizer } from "./cost.js";
export class ModelRouter {
    adapter;
    config;
    fallback;
    costOptimizer;
    constructor(adapter, config) {
        this.adapter = adapter;
        this.config = config;
        this.fallback = new FallbackHandler(adapter);
        this.costOptimizer = new CostOptimizer(config?.budgetLimitUSD);
    }
    async route(request) {
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
    getRecommendedModel(task) {
        return DEFAULT_TASK_MODEL_MAP[task] ?? DEFAULT_TASK_MODEL_MAP["default"];
    }
    getFallbackHandler() {
        return this.fallback;
    }
    getCostOptimizer() {
        return this.costOptimizer;
    }
    estimateInputTokens(request) {
        let total = 0;
        for (const msg of request.messages) {
            total += msg.content.length;
        }
        return Math.ceil(total / 4); // rough char→token estimate
    }
}
//# sourceMappingURL=router.js.map