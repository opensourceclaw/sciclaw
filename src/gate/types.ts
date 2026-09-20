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

// Copyright 2026 Peter Cheng
// SciClaw v3.5.0 — Gate Types

/** Gate status values */
export type GateStatus = "pending" | "passed" | "failed" | "blocked";

/** Gate state with metadata */
export interface GateState {
  gateId: string;
  status: GateStatus;
  timestamp: number;
  metadata: Record<string, unknown>;
}

/** Result of validating all gates */
export interface ValidationResult {
  allPassed: boolean;
  failedGates: string[];
  warnings: string[];
}

/** Type check result */
export interface TypeCheckResult {
  passed: boolean;
  errors: number;
  output?: string;
}

/** Build result */
export interface BuildResult {
  passed: boolean;
  output?: string;
}

/** Test result */
export interface TestResult {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
}

/** Regression check result */
export interface RegressionResult {
  passed: boolean;
  previousTotal: number;
  currentTotal: number;
}

/** Quality checks result */
export interface QualityChecks {
  hasChineseChars: boolean;
  hasHardcodedPaths: boolean;
  hasMissingApacheHeaders: boolean;
}

/** Submission for internal verification */
export interface InternalVerifySubmission {
  pipelineId: string;
  version: string;
  typeCheck: TypeCheckResult;
  build: BuildResult;
  tests: TestResult;
  regression: RegressionResult;
  qualityChecks: QualityChecks;
  configValid?: boolean;
  dependenciesValid?: boolean;
}

/** Verify result with details */
export interface VerifyResult {
  allPassed: boolean;
  failedGates: string[];
  warnings: string[];
  summary: string;
}

/** Internal verify gate config */
export interface InternalVerifyGateConfig {
  gateId?: string;
  baseDir?: string;
}
