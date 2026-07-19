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
/**
 * Approval gate that integrates with the Gate system.
 *
 * Design Decision: ApprovalGate uses existing GateRegistry for consistency
 * with InternalVerifyGate pattern.
 */
export class ApprovalGate {
    gateId;
    registry;
    approvalFlow;
    constructor(registry, approvalFlow, gateId) {
        this.registry = registry;
        this.gateId = gateId ?? "approval";
        this.approvalFlow = approvalFlow;
        this.registry.setGateStatus(this.gateId, "pending");
    }
    /**
     * Check if approval is required and process accordingly.
     * Returns true if approved, false if rejected/pending.
     */
    async check(point, pipelineId, context) {
        const status = this.registry.getGateStatus(this.gateId);
        if (status === "passed") {
            return true;
        }
        if (status === "failed") {
            return false;
        }
        // Create and request approval
        const request = this.approvalFlow.createRequest(point, pipelineId, `Approval Required: ${point}`, `Please approve this ${point} decision.`, context);
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
    async requestApproval(point, pipelineId, title, description, context) {
        const request = this.approvalFlow.createRequest(point, pipelineId, title, description, context);
        return this.approvalFlow.requestApproval(request);
    }
    /**
     * Process human decision.
     */
    processDecision(requestId, decision, decidedBy, reason) {
        const result = this.approvalFlow.processDecision(requestId, decision, decidedBy, reason);
        // Update gate status
        if (result.status === "approved") {
            this.markApproved(requestId, decidedBy);
        }
        else if (result.status === "rejected") {
            this.markRejected(requestId, reason ?? "Rejected");
        }
        return result;
    }
    /**
     * Get gate status.
     */
    getStatus() {
        return this.registry.getGateStatus(this.gateId);
    }
    /**
     * Mark gate as passed.
     */
    markApproved(requestId, approver) {
        this.registry.setGateStatus(this.gateId, "passed", {
            requestId,
            approver,
            approvedAt: Date.now(),
        });
    }
    /**
     * Mark gate as failed.
     */
    markRejected(requestId, reason) {
        this.registry.setGateStatus(this.gateId, "failed", {
            requestId,
            reason,
            rejectedAt: Date.now(),
        });
    }
    /**
     * Get pending approvals.
     */
    getPendingApprovals() {
        return this.approvalFlow.getPendingApprovals();
    }
    /**
     * Get approval flow instance.
     */
    getApprovalFlow() {
        return this.approvalFlow;
    }
}
//# sourceMappingURL=ApprovalGate.js.map