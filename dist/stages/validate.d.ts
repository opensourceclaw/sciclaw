/**
 * DeepClaw v3.9.0 — VALIDATE Stage
 */
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
export declare function validateStage(context: ResearchContext): Promise<ValidationResult>;
//# sourceMappingURL=validate.d.ts.map