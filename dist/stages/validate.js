/**
 * DeepClaw v3.9.0 — VALIDATE Stage
 */
import { researchGateRegistry } from "../gate/research/research-gate-registry.js";
import { metricsCollector } from "../observe/MetricsCollector.js";
export async function validateStage(context) {
    const biasGate = researchGateRegistry.get("bias-detection");
    const biasResult = await biasGate.check(context);
    metricsCollector.recordGateResult("bias-detection", biasResult.passed);
    const biasReport = {
        selectionBias: biasResult.details.find(d => d.item === "selection")?.score ?? 0,
        confirmationBias: biasResult.details.find(d => d.item === "confirmation")?.score ?? 0,
        temporalBias: biasResult.details.find(d => d.item === "temporal")?.score ?? 0,
        overall: biasResult.score,
    };
    const crossGate = researchGateRegistry.get("cross-validation");
    const crossResult = await crossGate.check(context);
    metricsCollector.recordGateResult("cross-validation", crossResult.passed);
    const crossValidation = {
        claimsWithSupport: crossResult.details.filter(d => d.score >= 0.8).length,
        claimsWithoutSupport: crossResult.details.filter(d => d.score < 0.5).length,
        overallAgreement: crossResult.score,
    };
    const isValid = biasResult.passed && crossResult.passed;
    return {
        isValid,
        biasReport,
        crossValidation,
        recommendations: [...(biasResult.recommendations ?? []), ...(crossResult.recommendations ?? [])],
    };
}
//# sourceMappingURL=validate.js.map