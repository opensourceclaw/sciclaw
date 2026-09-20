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
// SciClaw v3.5.0 - Approval Flow Tests

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { ApprovalFlow } from "../../src/approval/ApprovalFlow.js";
import type { ApprovalRequest } from "../../src/approval/types.js";

describe("ApprovalFlow", () => {
  let tmpDir: string;
  let flow: ApprovalFlow;

  beforeEach(() => {
    tmpDir = path.join(os.tmpdir(), `deepclaw-approval-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    fs.mkdirSync(tmpDir, { recursive: true });
    flow = new ApprovalFlow({
      approvalDir: tmpDir,
      defaultTimeoutMs: 3600000,
      autoApproveOnTimeout: ["research_plan"],
      autoRejectOnTimeout: ["budget_threshold", "source_quality"],
    });
  });

  afterEach(() => {
    try { fs.rmSync(tmpDir, { recursive: true }); } catch {}
  });

  describe("createRequest", () => {
    it("creates approval request with correct fields", () => {
      const request = flow.createRequest(
        "research_plan",
        "pipeline-1",
        "Research Plan Approval",
        "Please approve this plan"
      );

      expect(request.id).toBeDefined();
      expect(request.point).toBe("research_plan");
      expect(request.pipelineId).toBe("pipeline-1");
      expect(request.title).toBe("Research Plan Approval");
      expect(request.status).toBe("pending");
    });

    it("creates request with context", () => {
      const request = flow.createRequest(
        "budget_threshold",
        "pipeline-1",
        "Budget Approval",
        "Token budget exceeded",
        { estimatedTokens: 150000 }
      );

      expect(request.context.estimatedTokens).toBe(150000);
    });
  });

  describe("requestApproval", () => {
    it("writes request to inbox", async () => {
      const request = flow.createRequest(
        "research_plan",
        "pipeline-1",
        "Test",
        "Test"
      );

      await flow.requestApproval(request);

      const inboxPath = path.join(tmpDir, "inbox", `${request.id}.json`);
      expect(fs.existsSync(inboxPath)).toBe(true);
    });

    it("returns awaiting_approval status", async () => {
      const request = flow.createRequest(
        "research_plan",
        "pipeline-1",
        "Test",
        "Test"
      );

      const result = await flow.requestApproval(request);

      expect(result.status).toBe("awaiting_approval");
    });
  });

  describe("processDecision", () => {
    it("approves request", async () => {
      const request = flow.createRequest(
        "research_plan",
        "pipeline-1",
        "Test",
        "Test"
      );
      await flow.requestApproval(request);

      const result = flow.processDecision(request.id, "approve", "tester");

      expect(result.status).toBe("approved");
      expect(result.decision).toBe("approve");
    });

    it("rejects request", async () => {
      const request = flow.createRequest(
        "research_plan",
        "pipeline-1",
        "Test",
        "Test"
      );
      await flow.requestApproval(request);

      const result = flow.processDecision(request.id, "reject", "tester", "Not acceptable");

      expect(result.status).toBe("rejected");
      expect(result.decision).toBe("reject");
      expect(result.reason).toBe("Not acceptable");
    });

    it("moves approved request to processed", async () => {
      const request = flow.createRequest(
        "research_plan",
        "pipeline-1",
        "Test",
        "Test"
      );
      await flow.requestApproval(request);
      flow.processDecision(request.id, "approve", "tester");

      const processedPath = path.join(tmpDir, "processed", `${request.id}.json`);
      expect(fs.existsSync(processedPath)).toBe(true);
    });
  });

  describe("checkStatus", () => {
    it("returns awaiting_approval for pending request", async () => {
      const request = flow.createRequest(
        "research_plan",
        "pipeline-1",
        "Test",
        "Test"
      );
      await flow.requestApproval(request);

      const status = flow.checkStatus(request.id);
      expect(status).toBe("awaiting_approval");
    });
  });

  describe("getPendingApprovals", () => {
    it("returns all pending approvals", async () => {
      const request1 = flow.createRequest("research_plan", "pipeline-1", "Test 1", "Test");
      const request2 = flow.createRequest("budget_threshold", "pipeline-1", "Test 2", "Test");

      await flow.requestApproval(request1);
      await flow.requestApproval(request2);

      const pending = flow.getPendingApprovals();
      expect(pending.length).toBe(2);
    });
  });

  describe("handleTimeout", () => {
    it("auto-approves research_plan on timeout", async () => {
      const request = flow.createRequest(
        "research_plan",
        "pipeline-1",
        "Test",
        "Test",
        {},
        0 // Immediate timeout
      );
      request.createdAt = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
      await flow.requestApproval(request);

      const result = flow.handleTimeout(request.id);

      expect(result.status).toBe("auto_approved");
    });

    it("auto-rejects budget_threshold on timeout", async () => {
      const request = flow.createRequest(
        "budget_threshold",
        "pipeline-1",
        "Test",
        "Test",
        {},
        0
      );
      request.createdAt = new Date(Date.now() - 3600000).toISOString();
      await flow.requestApproval(request);

      const result = flow.handleTimeout(request.id);

      expect(result.status).toBe("auto_rejected");
    });
  });

  describe("audit logging", () => {
    it("logs approval in audit log", async () => {
      const request = flow.createRequest(
        "research_plan",
        "pipeline-1",
        "Test",
        "Test"
      );
      await flow.requestApproval(request);
      flow.processDecision(request.id, "approve", "tester");

      const audit = flow.getAuditLog();
      expect(audit.length).toBe(2); // created + approved
      expect(audit[1].action).toBe("approved");
      expect(audit[1].decidedBy).toBe("tester");
    });
  });
});
