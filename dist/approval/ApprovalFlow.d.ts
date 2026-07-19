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
import type { ApprovalRequest, ApprovalResult, ApprovalStatus, ApprovalDecision, ApprovalFlowConfig, ApprovalAuditEntry, ApprovalPoint } from "./types.js";
/**
 * Approval flow state machine.
 *
 * State Transitions:
 * pending → awaiting_approval → approved / rejected / auto_approved / auto_rejected
 *
 * Design Decision: Timeout behavior is configurable per approval point.
 */
export declare class ApprovalFlow {
    private config;
    private approvalDir;
    private auditLog;
    constructor(config?: Partial<ApprovalFlowConfig>);
    /**
     * Create approval request.
     */
    createRequest(point: ApprovalPoint, pipelineId: string, title: string, description: string, context?: Record<string, unknown>, timeoutMs?: number): ApprovalRequest;
    /**
     * Request approval (write to inbox and wait).
     */
    requestApproval(request: ApprovalRequest): Promise<ApprovalResult>;
    /**
     * Check approval status.
     */
    checkStatus(requestId: string): ApprovalStatus;
    /**
     * Get pending approvals.
     */
    getPendingApprovals(): ApprovalRequest[];
    /**
     * Process approval decision.
     */
    processDecision(requestId: string, decision: ApprovalDecision, decidedBy: string, reason?: string): ApprovalResult;
    /**
     * Check for timed-out requests.
     */
    checkTimeouts(): ApprovalRequest[];
    /**
     * Handle timeout for a request.
     */
    handleTimeout(requestId: string): ApprovalResult;
    /**
     * Get audit log.
     */
    getAuditLog(limit?: number): ApprovalAuditEntry[];
    private logAudit;
    private persistRequest;
    private loadRequest;
    private writeToInbox;
    private moveToProcessed;
    private ensureDirs;
    private loadAuditLog;
    private persistAuditLog;
}
//# sourceMappingURL=ApprovalFlow.d.ts.map