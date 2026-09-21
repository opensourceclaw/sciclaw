import type { ModelCostEntry, TaskCategory } from "./types.js";
export declare class CostOptimizer {
    private budgetLimitUSD?;
    constructor(budgetLimitUSD?: number | undefined);
    estimate(model: string, inputTokens: number, outputTokens: number): number;
    isWithinBudget(model: string, estimatedInputTokens: number): boolean;
    recommendCheapest(task: TaskCategory, inputTokens: number): string;
    getModelCosts(): Record<string, ModelCostEntry>;
}
//# sourceMappingURL=cost.d.ts.map