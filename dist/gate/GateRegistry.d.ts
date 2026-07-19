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
import type { GateState, GateStatus, ValidationResult } from "./types.js";
export type StatusChangeCallback = (gateId: string, oldStatus: GateStatus, newStatus: GateStatus) => void;
export declare class GateRegistry {
    private gates;
    private listeners;
    private gatesDir;
    constructor(gatesDir?: string);
    getGateStatus(gateId: string): GateStatus;
    setGateStatus(gateId: string, status: GateStatus, metadata?: Record<string, unknown>): void;
    validateAllGates(): ValidationResult;
    onStatusChange(callback: StatusChangeCallback): void;
    getAllGates(): GateState[];
    reset(): void;
    private persist;
    private restore;
}
//# sourceMappingURL=GateRegistry.d.ts.map