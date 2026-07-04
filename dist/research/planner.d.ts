/**
 * Research Planner - Plans research strategies
 *
 * Copyright 2026 OpenClaw
 * Licensed under the Apache License, Version 2.0
 */
import type { ResearchPlan } from "./types.js";
/**
 * Plans research strategies for a given topic
 */
export declare class ResearchPlanner {
    private plans;
    /**
     * Create a research plan for a topic
     */
    createPlan(topic: string, depth?: number): ResearchPlan;
    /**
     * Get an existing plan
     */
    getPlan(topic: string): ResearchPlan | undefined;
    /**
     * Generate search queries for the topic
     */
    private generateQueries;
    /**
     * Generate subtopics to explore
     */
    private generateSubtopics;
    /**
     * Update plan status
     */
    updateStatus(topic: string, status: ResearchPlan["status"]): void;
    /**
     * Clear all plans
     */
    clear(): void;
}
/**
 * Create a research plan (convenience function)
 */
export declare function createPlan(topic: string, depth?: number): ResearchPlan;
//# sourceMappingURL=planner.d.ts.map