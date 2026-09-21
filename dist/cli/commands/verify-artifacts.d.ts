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
import type { InternalVerifySubmission, TestResult, QualityChecks } from "../../gate/types.js";
/** Parse the vitest text-reporter summary line into a TestResult. */
export declare function parseVitestSummary(output: string): TestResult;
/** Real quality scans over the TypeScript sources (warning-tier rules 7-9). */
export declare function scanQuality(srcDir: string): QualityChecks;
/**
 * Build the verify submission from REAL artifacts: live typecheck/build/test runs,
 * the package version, the previous run's test count (regression baseline) and
 * real source-quality scans. Replaces the hardcoded all-green literal (GA-A6).
 */
export declare function collectVerifySubmission(pipelineId: string, cwd?: string): InternalVerifySubmission;
//# sourceMappingURL=verify-artifacts.d.ts.map