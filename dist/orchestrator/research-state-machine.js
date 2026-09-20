/**
 * SciClaw v3.9.0 — 7-Stage Research State Machine
 */
import { researchGateRegistry } from "../gate/research/research-gate-registry.js";
import { metricsCollector } from "../observe/MetricsCollector.js";
const STAGE_ORDER = [
    "observe", "plan", "search", "extract",
    "synthesize", "validate", "report",
];
export class ResearchStateMachine {
    currentStage = "observe";
    context;
    gateResults = new Map();
    constructor(initialContext = {}) {
        this.context = this.initContext(initialContext);
    }
    async transition() {
        const gates = researchGateRegistry.getByStage(this.currentStage);
        for (const gate of gates) {
            const result = await gate.check(this.context);
            metricsCollector.recordGateResult(gate.name, result.passed);
            if (!result.passed) {
                return { success: false, stage: this.currentStage, gateResults: this.gateResults };
            }
            this.gateResults.set(gate.name, result.passed);
        }
        const currentIndex = STAGE_ORDER.indexOf(this.currentStage);
        if (currentIndex < STAGE_ORDER.length - 1) {
            this.currentStage = STAGE_ORDER[currentIndex + 1];
            return { success: true, stage: this.currentStage };
        }
        return { success: true, stage: "report" };
    }
    getStage() {
        return this.currentStage;
    }
    getContext() {
        return this.context;
    }
    updateContext(updates) {
        this.context = { ...this.context, ...updates };
    }
    getGateResults() {
        return new Map(this.gateResults);
    }
    reset() {
        this.currentStage = "observe";
        this.gateResults.clear();
    }
    getAllStages() {
        return [...STAGE_ORDER];
    }
    getRemainingStages() {
        const idx = STAGE_ORDER.indexOf(this.currentStage);
        return idx >= 0 ? STAGE_ORDER.slice(idx) : [];
    }
    getProgress() {
        const idx = STAGE_ORDER.indexOf(this.currentStage);
        return idx >= 0 ? (idx) / STAGE_ORDER.length : 0;
    }
    initContext(initial) {
        return {
            topic: initial.topic ?? "",
            questions: initial.questions ?? [],
            searchResults: initial.searchResults ?? [],
            extractions: initial.extractions ?? [],
            stage: initial.stage ?? "observe",
        };
    }
}
//# sourceMappingURL=research-state-machine.js.map