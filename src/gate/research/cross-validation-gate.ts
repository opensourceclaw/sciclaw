/**
 * DeepClaw v3.9.0 — Cross Validation Gate
 */

import type { ResearchGate, GateResult, GateDetail } from "./types.js";
import type { ResearchContext, ResearchStage, SearchResult } from "../../context/ResearchContext.js";

export class CrossValidationGate implements ResearchGate {
  readonly name = "cross-validation";
  readonly stage: ResearchStage = "synthesize";

  async check(context: ResearchContext): Promise<GateResult> {
    if (!context.synthesis) {
      return { passed: false, score: 0, threshold: 0.8, details: [{ item: "synthesis", score: 0, reason: "No synthesis available" }] };
    }
    const details: GateDetail[] = [];
    const claims = context.synthesis.arguments.map(a => a.claim);
    for (const claim of claims) {
      const supportingSources = this.findSupportingSources(claim, context);
      const score = supportingSources.length >= 3 ? 0.9 : supportingSources.length >= 2 ? 0.8 : supportingSources.length >= 1 ? 0.5 : 0.2;
      details.push({ item: claim.substring(0, 50) + "...", score, reason: `Supported by ${supportingSources.length} sources` });
    }
    const avgScore = details.length > 0 ? details.reduce((sum, d) => sum + d.score, 0) / details.length : 0;
    return { passed: avgScore >= 0.8, score: avgScore, threshold: 0.8, details, recommendations: this.recommend(details, claims) };
  }

  private findSupportingSources(claim: string, context: ResearchContext): SearchResult[] {
    const claimWords = claim.toLowerCase().split(/\s+/);
    return context.searchResults.filter(result => {
      const text = (result.title + " " + result.snippet).toLowerCase();
      const matchCount = claimWords.filter(w => w.length > 3 && text.includes(w)).length;
      return matchCount >= 2;
    });
  }

  private recommend(details: GateDetail[], _claims: string[]): string[] {
    const weakClaims = details.filter(d => d.score < 0.6);
    if (weakClaims.length > 0) return [`Strengthen evidence for ${weakClaims.length} claims`];
    return [];
  }
}
