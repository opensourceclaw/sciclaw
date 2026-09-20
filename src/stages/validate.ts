/**
 * SciClaw v3.9.0 — VALIDATE Stage
 */

import { researchGateRegistry } from "../gate/research/research-gate-registry.js";
import { metricsCollector } from "../observe/MetricsCollector.js";
import type { ResearchContext } from "../context/ResearchContext.js";

export interface BiasReport {
  selectionBias: number;
  confirmationBias: number;
  temporalBias: number;
  overall: number;
}

export interface CrossValidationResult {
  claimsWithSupport: number;
  claimsWithoutSupport: number;
  overallAgreement: number;
}

export interface ValidationResult {
  isValid: boolean;
  biasReport: BiasReport;
  crossValidation: CrossValidationResult;
  recommendations: string[];
}

export async function validateStage(context: ResearchContext): Promise<ValidationResult> {
  const biasGate = researchGateRegistry.get("bias-detection")!;
  const biasResult = await biasGate.check(context);
  metricsCollector.recordGateResult("bias-detection", biasResult.passed);

  const biasReport: BiasReport = {
    selectionBias: biasResult.details.find(d => d.item === "selection")?.score ?? 0,
    confirmationBias: biasResult.details.find(d => d.item === "confirmation")?.score ?? 0,
    temporalBias: biasResult.details.find(d => d.item === "temporal")?.score ?? 0,
    overall: biasResult.score,
  };

  const crossGate = researchGateRegistry.get("cross-validation")!;
  const crossResult = await crossGate.check(context);
  metricsCollector.recordGateResult("cross-validation", crossResult.passed);

  const crossValidation: CrossValidationResult = {
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
