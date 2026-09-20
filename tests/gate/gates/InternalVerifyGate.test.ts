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
// SciClaw v3.5.0 - Internal Verify Gate Tests

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { GateRegistry } from "../../../src/gate/GateRegistry";
import { InternalVerifyGate } from "../../../src/gate/gates/InternalVerifyGate";
import type { InternalVerifySubmission } from "../../../src/gate/types";

function makeSubmission(overrides?: Partial<InternalVerifySubmission>): InternalVerifySubmission {
  return {
    pipelineId: "pipeline-test-1",
    version: "v3.5.0",
    typeCheck: { passed: true, errors: 0 },
    build: { passed: true },
    tests: { total: 100, passed: 100, failed: 0, skipped: 0 },
    regression: { passed: true, previousTotal: 95, currentTotal: 100 },
    qualityChecks: {
      hasChineseChars: false,
      hasHardcodedPaths: false,
      hasMissingApacheHeaders: false,
    },
    configValid: true,
    ...overrides,
  };
}

describe("InternalVerifyGate", () => {
  let tmpDir: string;
  let registry: GateRegistry;
  let gate: InternalVerifyGate;

  beforeEach(() => {
    tmpDir = path.join(os.tmpdir(), `deepclaw-gate-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    fs.mkdirSync(tmpDir, { recursive: true });
    registry = new GateRegistry(tmpDir);
    gate = new InternalVerifyGate(registry, { baseDir: tmpDir });
  });

  afterEach(() => {
    try { fs.rmSync(tmpDir, { recursive: true }); } catch {}
  });

  describe("construction", () => {
    it("creates with default gateId", () => {
      expect(gate).toBeDefined();
      expect(gate.getStatus()).toBe("pending");
    });

    it("accepts custom gateId via config", () => {
      const customGate = new InternalVerifyGate(registry, { gateId: "custom-internal-verify" });
      customGate.markAsVerified(makeSubmission(), "tester");
      expect(registry.getGateStatus("custom-internal-verify")).toBe("passed");
    });
  });

  describe("validate", () => {
    it("valid submission passes", () => {
      const result = gate.validate(makeSubmission());
      expect(result.allPassed).toBe(true);
      expect(result.failedGates).toHaveLength(0);
    });

    it("fails on type check errors", () => {
      const result = gate.validate(makeSubmission({
        typeCheck: { passed: false, errors: 5 },
      }));
      expect(result.allPassed).toBe(false);
      expect(result.failedGates).toContain("type_check_failed");
    });

    it("fails on build failure", () => {
      const result = gate.validate(makeSubmission({
        build: { passed: false, output: "Build failed" },
      }));
      expect(result.allPassed).toBe(false);
      expect(result.failedGates).toContain("build_failed");
    });

    it("fails on test failures", () => {
      const result = gate.validate(makeSubmission({
        tests: { total: 100, passed: 95, failed: 5, skipped: 0 },
      }));
      expect(result.allPassed).toBe(false);
      expect(result.failedGates).toContain("tests_failed");
    });

    it("fails on incomplete tests", () => {
      const result = gate.validate(makeSubmission({
        tests: { total: 100, passed: 90, failed: 0, skipped: 10 },
      }));
      expect(result.allPassed).toBe(false);
      expect(result.failedGates).toContain("incomplete_tests");
    });

    it("fails on regression", () => {
      const result = gate.validate(makeSubmission({
        regression: { passed: false, previousTotal: 100, currentTotal: 95 },
      }));
      expect(result.allPassed).toBe(false);
      expect(result.failedGates).toContain("regression_failed");
    });

    it("fails on config error", () => {
      const result = gate.validate(makeSubmission({
        configValid: false,
      }));
      expect(result.allPassed).toBe(false);
      expect(result.failedGates).toContain("config_error");
    });

    it("warns on quality issues (doesn't block)", () => {
      const result = gate.validate(makeSubmission({
        qualityChecks: {
          hasChineseChars: true,
          hasHardcodedPaths: true,
          hasMissingApacheHeaders: true,
        },
      }));
      expect(result.allPassed).toBe(true); // Warnings don't block
      expect(result.warnings).toHaveLength(3);
      expect(result.warnings).toContain("chinese_characters_detected");
      expect(result.warnings).toContain("hardcoded_paths_detected");
      expect(result.warnings).toContain("missing_apache_headers");
    });

    it("correct summary with regression delta", () => {
      const result = gate.validate(makeSubmission({
        regression: { passed: true, previousTotal: 95, currentTotal: 100 },
      }));
      expect(result.summary).toContain("+5 new tests");
    });

    it("handles multiple failures simultaneously", () => {
      const result = gate.validate(makeSubmission({
        typeCheck: { passed: false, errors: 3 },
        build: { passed: false },
        tests: { total: 100, passed: 100, failed: 0, skipped: 0 },
        configValid: false,
      }));
      expect(result.allPassed).toBe(false);
      expect(result.failedGates).toHaveLength(3);
    });
  });

  describe("submit", () => {
    it("submit() succeeds on valid submission", async () => {
      await gate.submit(makeSubmission());
      expect(gate.getStatus()).toBe("passed");
    });

    it("submit() throws on invalid submission", async () => {
      await expect(
        gate.submit(makeSubmission({ typeCheck: { passed: false, errors: 1 } }))
      ).rejects.toThrow(/Internal verify validation failed/);
      expect(gate.getStatus()).toBe("failed");
    });
  });

  describe("markAsVerified/markAsRejected", () => {
    it("markAsVerified() sets status to passed", () => {
      gate.markAsVerified(makeSubmission(), "tester", "All checks passed");
      expect(gate.getStatus()).toBe("passed");
    });

    it("markAsRejected() sets status to failed", () => {
      gate.markAsRejected(makeSubmission(), ["Issue 1", "Issue 2"]);
      expect(gate.getStatus()).toBe("failed");
    });
  });
});
