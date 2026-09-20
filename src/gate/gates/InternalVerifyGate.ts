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
// SciClaw v3.5.0 — Internal Verify Gate

import { GateRegistry } from "../GateRegistry.js";
import type {
  GateStatus,
  InternalVerifySubmission,
  InternalVerifyGateConfig,
  VerifyResult,
} from "../types.js";

/**
 * InternalVerifyGate enforces quality checks before research pipeline can proceed.
 *
 * Validation Rules (9 total):
 * - 6 Failed rules (block pipeline):
 *   1. type_check_failed - TypeScript compilation failed
 *   2. build_failed - Build process failed
 *   3. tests_failed - Tests are failing
 *   4. incomplete_tests - Not all tests completed
 *   5. regression_failed - Test count decreased
 *   6. config_error - Configuration invalid
 *
 * - 3 Warning rules (don't block):
 *   7. chinese_characters_detected - Chinese chars in source
 *   8. hardcoded_paths_detected - Hardcoded paths found
 *   9. missing_apache_headers - Missing license headers
 */
export class InternalVerifyGate {
  private readonly gateId: string;
  private readonly registry: GateRegistry;

  constructor(registry: GateRegistry, config?: InternalVerifyGateConfig) {
    this.registry = registry;
    this.gateId = config?.gateId ?? "internal-verify";
    this.registry.setGateStatus(this.gateId, "pending");
  }

  /**
   * Submit verification data asynchronously.
   * Throws if validation fails.
   */
  async submit(submission: InternalVerifySubmission): Promise<void> {
    const validation = this.validate(submission);
    if (!validation.allPassed) {
      this.registry.setGateStatus(this.gateId, "failed", {
        pipelineId: submission.pipelineId,
        version: submission.version,
        failures: validation.failedGates,
        warnings: validation.warnings,
        summary: validation.summary,
      });
      throw new Error(
        `Internal verify validation failed: ${validation.failedGates.join(", ")}`
      );
    }
    this.registry.setGateStatus(this.gateId, "passed", {
      pipelineId: submission.pipelineId,
      version: submission.version,
      warnings: validation.warnings,
      summary: validation.summary,
    });
  }

  /**
   * Validate submission synchronously.
   * Returns result with failed gates and warnings.
   */
  validate(submission: InternalVerifySubmission): VerifyResult {
    const failedGates: string[] = [];
    const warnings: string[] = [];

    // ── Failed Rules (block pipeline) ─────────────────────────────

    // Rule 1: type_check_failed
    if (!submission.typeCheck.passed || submission.typeCheck.errors > 0) {
      failedGates.push("type_check_failed");
    }

    // Rule 2: build_failed
    if (!submission.build.passed) {
      failedGates.push("build_failed");
    }

    // Rule 3: tests_failed
    if (submission.tests.failed > 0) {
      failedGates.push("tests_failed");
    }

    // Rule 4: incomplete_tests
    if (submission.tests.passed < submission.tests.total) {
      failedGates.push("incomplete_tests");
    }

    // Rule 5: regression_failed
    if (!submission.regression.passed) {
      failedGates.push("regression_failed");
    }

    // Rule 6: config_error
    if (submission.configValid === false) {
      failedGates.push("config_error");
    }

    // ── Warning Rules (don't block) ───────────────────────────────

    // Rule 7: chinese_characters_detected
    if (submission.qualityChecks.hasChineseChars) {
      warnings.push("chinese_characters_detected");
    }

    // Rule 8: hardcoded_paths_detected
    if (submission.qualityChecks.hasHardcodedPaths) {
      warnings.push("hardcoded_paths_detected");
    }

    // Rule 9: missing_apache_headers
    if (submission.qualityChecks.hasMissingApacheHeaders) {
      warnings.push("missing_apache_headers");
    }

    const summary = this.buildSummary(
      failedGates,
      warnings,
      submission.tests,
      submission.regression
    );

    return {
      allPassed: failedGates.length === 0,
      failedGates,
      warnings,
      summary,
    };
  }

  /**
   * Mark gate as verified (passed).
   */
  markAsVerified(submission: InternalVerifySubmission, verifier: string, comments?: string): void {
    this.registry.setGateStatus(this.gateId, "passed", {
      pipelineId: submission.pipelineId,
      version: submission.version,
      testCount: submission.tests.total,
      verifiedAt: Date.now(),
      verifier,
      comments,
    });
  }

  /**
   * Mark gate as rejected (failed).
   */
  markAsRejected(submission: InternalVerifySubmission, issues: string[]): void {
    this.registry.setGateStatus(this.gateId, "failed", {
      pipelineId: submission.pipelineId,
      version: submission.version,
      issues,
      rejectedAt: Date.now(),
    });
  }

  /**
   * Get current gate status.
   */
  getStatus(): GateStatus {
    return this.registry.getGateStatus(this.gateId);
  }

  // ── Private Helpers ─────────────────────────────────────────────

  private buildSummary(
    failedGates: string[],
    warnings: string[],
    tests: { total: number; passed: number; failed: number },
    regression: { passed: boolean; previousTotal: number; currentTotal: number }
  ): string {
    const parts: string[] = [];

    if (failedGates.length === 0) {
      parts.push(`All ${tests.total} tests passed`);
    } else {
      parts.push(`${failedGates.length} check(s) failed`);
    }

    if (tests.failed > 0) {
      parts.push(`${tests.failed} test(s) failed`);
    }

    if (!regression.passed) {
      const delta = regression.currentTotal - regression.previousTotal;
      parts.push(`${delta} test regression`);
    } else if (regression.currentTotal > regression.previousTotal) {
      const delta = regression.currentTotal - regression.previousTotal;
      parts.push(`+${delta} new tests`);
    }

    if (warnings.length > 0) {
      parts.push(`${warnings.length} warning(s)`);
    }

    return parts.join(". ");
  }
}
