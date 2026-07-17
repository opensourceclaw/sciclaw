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
// DeepClaw v3.5.0 - Approval Gate Tests

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { GateRegistry } from "../../src/gate/GateRegistry.js";
import { ApprovalFlow } from "../../src/approval/ApprovalFlow.js";
import { ApprovalGate } from "../../src/approval/ApprovalGate.js";

describe("ApprovalGate", () => {
  let tmpDir: string;
  let registry: GateRegistry;
  let flow: ApprovalFlow;
  let gate: ApprovalGate;

  beforeEach(() => {
    tmpDir = path.join(os.tmpdir(), `deepclaw-gate-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    fs.mkdirSync(tmpDir, { recursive: true });
    registry = new GateRegistry(tmpDir);
    flow = new ApprovalFlow({ approvalDir: tmpDir });
    gate = new ApprovalGate(registry, flow);
  });

  afterEach(() => {
    try { fs.rmSync(tmpDir, { recursive: true }); } catch {}
  });

  it("creates with default gateId", () => {
    expect(gate.getStatus()).toBe("pending");
  });

  it("creates with custom gateId", () => {
    const customGate = new ApprovalGate(registry, flow, "custom-approval");
    customGate.markApproved("test-id", "tester");
    expect(registry.getGateStatus("custom-approval")).toBe("passed");
  });

  it("markApproved() sets gate to passed", () => {
    gate.markApproved("test-id", "tester");
    expect(gate.getStatus()).toBe("passed");
  });

  it("markRejected() sets gate to failed", () => {
    gate.markRejected("test-id", "Test rejection");
    expect(gate.getStatus()).toBe("failed");
  });

  it("processDecision() updates gate status", async () => {
    const result = await gate.requestApproval(
      "research_plan",
      "pipeline-1",
      "Test",
      "Test",
      {}
    );

    gate.processDecision(result.requestId, "approve", "tester");
    expect(gate.getStatus()).toBe("passed");
  });

  it("getPendingApprovals() returns pending requests", async () => {
    await gate.requestApproval("research_plan", "pipeline-1", "Test 1", "Test", {});
    await gate.requestApproval("budget_threshold", "pipeline-1", "Test 2", "Test", {});

    const pending = gate.getPendingApprovals();
    expect(pending.length).toBe(2);
  });

  it("integrates with GateRegistry", () => {
    gate.markApproved("test-id", "tester");

    const status = registry.getGateStatus("approval");
    expect(status).toBe("passed");
  });
});
