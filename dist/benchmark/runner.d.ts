import type { BenchmarkTask, BenchmarkResult, BenchmarkReport, BenchmarkCategory } from "./types.js";
export declare class BenchmarkRunner {
    private tasks;
    registerTask(task: BenchmarkTask): void;
    registerTasks(tasks: BenchmarkTask[]): void;
    unregisterTask(taskId: string): boolean;
    getRegisteredTasks(): BenchmarkTask[];
    getRegisteredCategories(): BenchmarkCategory[];
    runAll(): Promise<BenchmarkReport>;
    runCategory(category: BenchmarkCategory): Promise<BenchmarkReport>;
    runTask(taskId: string): Promise<BenchmarkResult>;
    private computeScores;
    private buildReport;
}
//# sourceMappingURL=runner.d.ts.map