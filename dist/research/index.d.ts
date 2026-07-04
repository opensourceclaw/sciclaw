/**
 * Research module - Deep research orchestration
 *
 * Copyright 2026 OpenClaw
 * Licensed under the Apache License, Version 2.0
 */
import type { ResearchOptions, ResearchResult } from "../types/index.js";
export type { ResearchPlan, ResearchFinding, Finding, SynthesisRequest, SynthesisSection, SynthesisResult, ResearchSection as ResearchReportSection, SectionCandidate, SectionAnalysis, ReportConfig, ThemeInfo, LLMEngine, } from "./types.js";
export { ResearchPlanner, createPlan } from "./planner.js";
export { ResearchSearchEngine, researchSearch, } from "./search.js";
export { ResearchSynthesizer, ReportFormatter, synthesize, } from "./synthesizer.js";
export { LLMSynthesizer, createFinding, synthesizeFindings, } from "./synthesizer_v2.js";
export { SmartSectioner, smartSectioner, } from "./smart_sectioning.js";
export { ReportGenerator, generateReport as generateSynthesisReport, } from "./report_generator.js";
export { ResearchRunner, runResearch, } from "./runner.js";
/**
 * Conduct research on a topic (main entry point)
 */
export declare function conductResearch(options: ResearchOptions): Promise<ResearchResult>;
export { conductResearch as default };
//# sourceMappingURL=index.d.ts.map