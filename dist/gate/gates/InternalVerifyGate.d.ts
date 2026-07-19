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
import { GateRegistry } from "../GateRegistry.js";
import type { GateStatus, InternalVerifySubmission, InternalVerifyGateConfig, VerifyResult } from "../types.js";
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
export declare class InternalVerifyGate {
    private readonly gateId;
    private readonly registry;
    constructor(registry: GateRegistry, config?: InternalVerifyGateConfig);
    /**
     * Submit verification data asynchronously.
     * Throws if validation fails.
     */
    submit(submission: InternalVerifySubmission): Promise<void>;
    /**
     * Validate submission synchronously.
     * Returns result with failed gates and warnings.
     */
    validate(submission: InternalVerifySubmission): VerifyResult;
    /**
     * Mark gate as verified (passed).
     */
    markAsVerified(submission: InternalVerifySubmission, verifier: string, comments?: string): void;
    /**
     * Mark gate as rejected (failed).
     */
    markAsRejected(submission: InternalVerifySubmission, issues: string[]): void;
    /**
     * Get current gate status.
     */
    getStatus(): GateStatus;
    private buildSummary;
}
//# sourceMappingURL=InternalVerifyGate.d.ts.map