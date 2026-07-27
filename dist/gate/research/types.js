/**
 * DeepClaw v3.9.0 — Research Gate Types
 */
export class GateNotPassedException extends Error {
    gateName;
    result;
    constructor(gateName, result) {
        super(`Gate ${gateName} not passed: score ${result.score} < threshold ${result.threshold}`);
        this.gateName = gateName;
        this.result = result;
        this.name = "GateNotPassedException";
    }
}
//# sourceMappingURL=types.js.map