/**
 * DeepClaw v3.9.0 — Research Gate Registry
 */
import { SourceCredibilityGate } from "./source-credibility-gate.js";
import { CrossValidationGate } from "./cross-validation-gate.js";
import { BiasDetectionGate } from "./bias-detection-gate.js";
import { CitationIntegrityGate } from "./citation-integrity-gate.js";
export class ResearchGateRegistry {
    gates = new Map();
    constructor() {
        this.registerDefaultGates();
    }
    registerDefaultGates() {
        this.register(new SourceCredibilityGate());
        this.register(new CrossValidationGate());
        this.register(new BiasDetectionGate());
        this.register(new CitationIntegrityGate());
    }
    register(gate) {
        this.gates.set(gate.name, gate);
    }
    get(name) {
        return this.gates.get(name);
    }
    getByStage(stage) {
        return Array.from(this.gates.values()).filter(g => g.stage === stage);
    }
    getAll() {
        return Array.from(this.gates.values());
    }
    async runAll(context) {
        const results = new Map();
        for (const [name, gate] of this.gates) {
            const result = await gate.check(context);
            results.set(name, result);
        }
        return results;
    }
    async runForStage(stage, context) {
        const results = new Map();
        const gates = this.getByStage(stage);
        for (const gate of gates) {
            const result = await gate.check(context);
            results.set(gate.name, result);
        }
        return results;
    }
}
export const researchGateRegistry = new ResearchGateRegistry();
//# sourceMappingURL=research-gate-registry.js.map