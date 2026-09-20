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
// SciClaw v3.5.0 — Approval Flow

import type {
  ApprovalRequest,
  ApprovalResult,
  ApprovalStatus,
  ApprovalDecision,
  ApprovalFlowConfig,
  ApprovalAuditEntry,
  ApprovalPoint,
} from "./types.js";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as crypto from "crypto";

const DEFAULT_APPROVAL_DIR = path.join(os.homedir(), ".deepclaw", "approval");

/**
 * Approval flow state machine.
 *
 * State Transitions:
 * pending → awaiting_approval → approved / rejected / auto_approved / auto_rejected
 *
 * Design Decision: Timeout behavior is configurable per approval point.
 */
export class ApprovalFlow {
  private config: Required<ApprovalFlowConfig>;
  private approvalDir: string;
  private auditLog: ApprovalAuditEntry[] = [];

  constructor(config?: Partial<ApprovalFlowConfig>) {
    this.config = {
      approvalDir: config?.approvalDir ?? DEFAULT_APPROVAL_DIR,
      defaultTimeoutMs: config?.defaultTimeoutMs ?? 3600000, // 1 hour
      autoApproveOnTimeout: config?.autoApproveOnTimeout ?? ["research_plan"],
      autoRejectOnTimeout: config?.autoRejectOnTimeout ?? ["budget_threshold", "source_quality"],
    };
    this.approvalDir = this.config.approvalDir;
    this.ensureDirs();
    this.loadAuditLog();
  }

  // ── Request Management ─────────────────────────────────────────────

  /**
   * Create approval request.
   */
  createRequest(
    point: ApprovalPoint,
    pipelineId: string,
    title: string,
    description: string,
    context?: Record<string, unknown>,
    timeoutMs?: number
  ): ApprovalRequest {
    const request: ApprovalRequest = {
      id: `approval-${crypto.randomUUID().slice(0, 8)}`,
      point,
      pipelineId,
      title,
      description,
      context: context ?? {},
      timeoutMs: timeoutMs ?? this.config.defaultTimeoutMs,
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    return request;
  }

  /**
   * Request approval (write to inbox and wait).
   */
  async requestApproval(request: ApprovalRequest): Promise<ApprovalResult> {
    // Update status
    request.status = "awaiting_approval";

    // Persist request
    this.persistRequest(request);

    // Write to inbox for human review
    this.writeToInbox(request);

    // Log audit entry
    this.logAudit({
      timestamp: request.createdAt,
      requestId: request.id,
      action: "created",
      point: request.point,
      pipelineId: request.pipelineId,
    });

    // Simulate waiting for approval (in real implementation, would poll or use events)
    // For now, return the result based on timeout
    return {
      requestId: request.id,
      status: "awaiting_approval",
    };
  }

  /**
   * Check approval status.
   */
  checkStatus(requestId: string): ApprovalStatus {
    const request = this.loadRequest(requestId);
    return request?.status ?? "pending";
  }

  /**
   * Get pending approvals.
   */
  getPendingApprovals(): ApprovalRequest[] {
    const inboxDir = path.join(this.approvalDir, "inbox");
    const requests: ApprovalRequest[] = [];

    try {
      const files = fs.readdirSync(inboxDir).filter(f => f.endsWith(".json"));
      for (const file of files) {
        const request = this.loadRequest(file.replace(".json", ""));
        if (request && request.status === "awaiting_approval") {
          requests.push(request);
        }
      }
    } catch {
      // Directory doesn't exist
    }

    return requests;
  }

  // ── Decision Processing ─────────────────────────────────────────────

  /**
   * Process approval decision.
   */
  processDecision(
    requestId: string,
    decision: ApprovalDecision,
    decidedBy: string,
    reason?: string
  ): ApprovalResult {
    const request = this.loadRequest(requestId);
    if (!request) {
      throw new Error(`Approval request not found: ${requestId}`);
    }

    request.decision = decision;
    request.decidedBy = decidedBy;
    request.decidedAt = new Date().toISOString();
    request.reason = reason;
    request.status = decision === "approve" ? "approved" : "rejected";

    // Move to processed
    this.moveToProcessed(request);

    // Log audit
    this.logAudit({
      timestamp: request.decidedAt,
      requestId: request.id,
      action: decision === "approve" ? "approved" : "rejected",
      point: request.point,
      pipelineId: request.pipelineId,
      decidedBy,
      reason,
    });

    return {
      requestId: request.id,
      status: request.status,
      decision,
      reason,
    };
  }

  // ── Timeout Handling ────────────────────────────────────────────────

  /**
   * Check for timed-out requests.
   */
  checkTimeouts(): ApprovalRequest[] {
    const pending = this.getPendingApprovals();
    const timedOut: ApprovalRequest[] = [];
    const now = Date.now();

    for (const request of pending) {
      const createdAt = new Date(request.createdAt).getTime();
      const timeoutMs = request.timeoutMs ?? this.config.defaultTimeoutMs;

      if (now - createdAt > timeoutMs) {
        timedOut.push(request);
      }
    }

    return timedOut;
  }

  /**
   * Handle timeout for a request.
   */
  handleTimeout(requestId: string): ApprovalResult {
    const request = this.loadRequest(requestId);
    if (!request) {
      throw new Error(`Approval request not found: ${requestId}`);
    }

    // Determine auto-action based on config
    const autoApprove = this.config.autoApproveOnTimeout.includes(request.point);
    const autoReject = this.config.autoRejectOnTimeout.includes(request.point);

    if (autoApprove) {
      request.status = "auto_approved";
      request.decision = "approve";
      request.decidedBy = "timeout";
    } else if (autoReject) {
      request.status = "auto_rejected";
      request.decision = "reject";
      request.decidedBy = "timeout";
    } else {
      // No auto-action, keep pending
      return {
        requestId: request.id,
        status: request.status,
      };
    }

    request.decidedAt = new Date().toISOString();
    request.reason = "Automatic decision due to timeout";

    // Move to processed
    this.moveToProcessed(request);

    // Log audit
    this.logAudit({
      timestamp: request.decidedAt,
      requestId: request.id,
      action: "timeout",
      point: request.point,
      pipelineId: request.pipelineId,
      decidedBy: "timeout",
    });

    return {
      requestId: request.id,
      status: request.status,
      decision: request.decision,
      reason: request.reason,
    };
  }

  // ── Audit Logging ───────────────────────────────────────────────────

  /**
   * Get audit log.
   */
  getAuditLog(limit?: number): ApprovalAuditEntry[] {
    const n = limit ?? 100;
    return this.auditLog.slice(-n);
  }

  // ── Private Methods ────────────────────────────────────────────────

  private logAudit(entry: ApprovalAuditEntry): void {
    this.auditLog.push(entry);
    this.persistAuditLog();
  }

  private persistRequest(request: ApprovalRequest): void {
    const filePath = path.join(this.approvalDir, `${request.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(request, null, 2), "utf-8");
  }

  private loadRequest(requestId: string): ApprovalRequest | null {
    // Try inbox first, then processed
    const locations = [
      path.join(this.approvalDir, "inbox", `${requestId}.json`),
      path.join(this.approvalDir, "processed", `${requestId}.json`),
      path.join(this.approvalDir, `${requestId}.json`),
    ];

    for (const filePath of locations) {
      if (fs.existsSync(filePath)) {
        try {
          const data = fs.readFileSync(filePath, "utf-8");
          return JSON.parse(data) as ApprovalRequest;
        } catch {
          continue;
        }
      }
    }

    return null;
  }

  private writeToInbox(request: ApprovalRequest): void {
    const inboxDir = path.join(this.approvalDir, "inbox");
    if (!fs.existsSync(inboxDir)) {
      fs.mkdirSync(inboxDir, { recursive: true });
    }
    const filePath = path.join(inboxDir, `${request.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(request, null, 2), "utf-8");
  }

  private moveToProcessed(request: ApprovalRequest): void {
    const processedDir = path.join(this.approvalDir, "processed");
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir, { recursive: true });
    }

    // Remove from inbox if exists
    const inboxPath = path.join(this.approvalDir, "inbox", `${request.id}.json`);
    if (fs.existsSync(inboxPath)) {
      fs.unlinkSync(inboxPath);
    }

    // Write to processed
    const processedPath = path.join(processedDir, `${request.id}.json`);
    fs.writeFileSync(processedPath, JSON.stringify(request, null, 2), "utf-8");
  }

  private ensureDirs(): void {
    const dirs = [
      this.approvalDir,
      path.join(this.approvalDir, "inbox"),
      path.join(this.approvalDir, "processed"),
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  private loadAuditLog(): void {
    const auditPath = path.join(this.approvalDir, "audit.json");
    if (fs.existsSync(auditPath)) {
      try {
        const data = fs.readFileSync(auditPath, "utf-8");
        this.auditLog = JSON.parse(data) as ApprovalAuditEntry[];
      } catch {
        this.auditLog = [];
      }
    }
  }

  private persistAuditLog(): void {
    const auditPath = path.join(this.approvalDir, "audit.json");
    fs.writeFileSync(auditPath, JSON.stringify(this.auditLog, null, 2), "utf-8");
  }
}
