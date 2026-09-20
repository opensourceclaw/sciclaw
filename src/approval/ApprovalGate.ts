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
// SciClaw v3.5.0 — Approval Gate

import { GateRegistry } from "../gate/GateRegistry.js";
import type { GateStatus } from "../gate/types.js";
import type { ApprovalRequest, ApprovalResult, ApprovalPoint, ApprovalDecision } from "./types.js";
import { ApprovalFlow } from "./ApprovalFlow.js";

/**
 * Approval gate that integrates with the Gate system.
 *
 * Design Decision: ApprovalGate uses existing GateRegistry for consistency
 * with InternalVerifyGate pattern.
 */
export class ApprovalGate {
  private readonly gateId: string;
  private readonly registry: GateRegistry;
  private readonly approvalFlow: ApprovalFlow;

  constructor(registry: GateRegistry, approvalFlow: ApprovalFlow, gateId?: string) {
    this.registry = registry;
    this.gateId = gateId ?? "approval";
    this.approvalFlow = approvalFlow;
    this.registry.setGateStatus(this.gateId, "pending");
  }

  /**
   * Check if approval is required and process accordingly.
   * Returns true if approved, false if rejected/pending.
   */
  async check(point: ApprovalPoint, pipelineId: string, context: Record<string, unknown>): Promise<boolean> {
    const status = this.registry.getGateStatus(this.gateId);

    if (status === "passed") {
      return true;
    }

    if (status === "failed") {
      return false;
    }

    // Create and request approval
    const request = this.approvalFlow.createRequest(
      point,
      pipelineId,
      `Approval Required: ${point}`,
      `Please approve this ${point} decision.`,
      context
    );

    const result = await this.approvalFlow.requestApproval(request);

    if (result.status === "approved" || result.status === "auto_approved") {
      this.markApproved(request.id, "auto");
      return true;
    }

    if (result.status === "rejected" || result.status === "auto_rejected") {
      this.markRejected(request.id, result.reason ?? "Rejected");
      return false;
    }

    // Still pending
    return false;
  }

  /**
   * Request approval for a decision.
   */
  async requestApproval(
    point: ApprovalPoint,
    pipelineId: string,
    title: string,
    description: string,
    context: Record<string, unknown>
  ): Promise<ApprovalResult> {
    const request = this.approvalFlow.createRequest(
      point,
      pipelineId,
      title,
      description,
      context
    );

    return this.approvalFlow.requestApproval(request);
  }

  /**
   * Process human decision.
   */
  processDecision(requestId: string, decision: ApprovalDecision, decidedBy: string, reason?: string): ApprovalResult {
    const result = this.approvalFlow.processDecision(requestId, decision, decidedBy, reason);

    // Update gate status
    if (result.status === "approved") {
      this.markApproved(requestId, decidedBy);
    } else if (result.status === "rejected") {
      this.markRejected(requestId, reason ?? "Rejected");
    }

    return result;
  }

  /**
   * Get gate status.
   */
  getStatus(): GateStatus {
    return this.registry.getGateStatus(this.gateId);
  }

  /**
   * Mark gate as passed.
   */
  markApproved(requestId: string, approver: string): void {
    this.registry.setGateStatus(this.gateId, "passed", {
      requestId,
      approver,
      approvedAt: Date.now(),
    });
  }

  /**
   * Mark gate as failed.
   */
  markRejected(requestId: string, reason: string): void {
    this.registry.setGateStatus(this.gateId, "failed", {
      requestId,
      reason,
      rejectedAt: Date.now(),
    });
  }

  /**
   * Get pending approvals.
   */
  getPendingApprovals(): ApprovalRequest[] {
    return this.approvalFlow.getPendingApprovals();
  }

  /**
   * Get approval flow instance.
   */
  getApprovalFlow(): ApprovalFlow {
    return this.approvalFlow;
  }
}
