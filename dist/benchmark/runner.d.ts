/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import type { BenchmarkTask, BenchmarkResult, BenchmarkReport, BenchmarkCategory } from "./types.js";
export declare class BenchmarkRunner {
    private tasks;
    private mock;
    constructor(opts?: {
        mock?: boolean;
    });
    registerTask(task: BenchmarkTask): void;
    registerTasks(tasks: BenchmarkTask[]): void;
    unregisterTask(taskId: string): boolean;
    getRegisteredTasks(): BenchmarkTask[];
    getRegisteredCategories(): BenchmarkCategory[];
    runAll(): Promise<BenchmarkReport>;
    runCategory(category: BenchmarkCategory): Promise<BenchmarkReport>;
    runTask(taskId: string): Promise<BenchmarkResult>;
    /**
     * Collect real evidence from the run: deterministic claim extraction over the
     * collected snippets and verification against the collected evidence corpus
     * (FactCheckService compares claims against source TEXTS, not URLs).
     */
    private buildExecutionBundle;
    /** Scores computed from the real execution bundle — no empty-array placeholders. */
    private computeScores;
    private buildReport;
}
//# sourceMappingURL=runner.d.ts.map