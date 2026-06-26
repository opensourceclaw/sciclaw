import type { TaskCategory, ModelRequest, ModelResponse } from "./types.js";
import type { OpenClawModelAdapter } from "./adapter.js";
import { FallbackHandler } from "./fallback.js";
import { CostOptimizer } from "./cost.js";
export interface RouterConfig {
    budgetLimitUSD?: number;
    preferCheapest?: boolean;
}
export declare class ModelRouter {
    private adapter;
    private config?;
    private fallback;
    private costOptimizer;
    constructor(adapter: OpenClawModelAdapter, config?: RouterConfig | undefined);
    route(request: ModelRequest): Promise<ModelResponse>;
    getRecommendedModel(task: TaskCategory): string;
    getFallbackHandler(): FallbackHandler;
    getCostOptimizer(): CostOptimizer;
    private estimateInputTokens;
}
//# sourceMappingURL=router.d.ts.map