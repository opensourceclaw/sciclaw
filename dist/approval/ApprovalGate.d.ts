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
export declare class ApprovalGate {
    private readonly gateId;
    private readonly registry;
    private readonly approvalFlow;
    constructor(registry: GateRegistry, approvalFlow: ApprovalFlow, gateId?: string);
    /**
     * Check if approval is required and process accordingly.
     * Returns true if approved, false if rejected/pending.
     */
    check(point: ApprovalPoint, pipelineId: string, context: Record<string, unknown>): Promise<boolean>;
    /**
     * Request approval for a decision.
     */
    requestApproval(point: ApprovalPoint, pipelineId: string, title: string, description: string, context: Record<string, unknown>): Promise<ApprovalResult>;
    /**
     * Process human decision.
     */
    processDecision(requestId: string, decision: ApprovalDecision, decidedBy: string, reason?: string): ApprovalResult;
    /**
     * Get gate status.
     */
    getStatus(): GateStatus;
    /**
     * Mark gate as passed.
     */
    markApproved(requestId: string, approver: string): void;
    /**
     * Mark gate as failed.
     */
    markRejected(requestId: string, reason: string): void;
    /**
     * Get pending approvals.
     */
    getPendingApprovals(): ApprovalRequest[];
    /**
     * Get approval flow instance.
     */
    getApprovalFlow(): ApprovalFlow;
}
//# sourceMappingURL=ApprovalGate.d.ts.map