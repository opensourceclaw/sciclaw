/**
 * Research Planner - Plans research strategies
 *
 * Copyright 2026 OpenClaw
 * Licensed under the Apache License, Version 2.0
 */
/**
 * Plans research strategies for a given topic
 */
export class ResearchPlanner {
    plans = new Map();
    /**
     * Create a research plan for a topic
     */
    createPlan(topic, depth = 3) {
        const plan = {
            topic,
            depth,
            queries: [],
            subtopics: [],
            status: "pending",
        };
        this.generateQueries(plan);
        this.generateSubtopics(plan);
        this.plans.set(topic, plan);
        return plan;
    }
    /**
     * Get an existing plan
     */
    getPlan(topic) {
        return this.plans.get(topic);
    }
    /**
     * Generate search queries for the topic
     */
    generateQueries(plan) {
        plan.queries.push(plan.topic);
        plan.queries.push(`${plan.topic} overview`);
        plan.queries.push(`${plan.topic} history`);
        // Add depth-based queries
        if (plan.depth > 1) {
            plan.queries.push(`${plan.topic} fundamentals`);
        }
        if (plan.depth > 2) {
            plan.queries.push(`${plan.topic} advanced`);
            plan.queries.push(`${plan.topic} research`);
        }
        if (plan.depth > 3) {
            plan.queries.push(`${plan.topic} latest developments`);
            plan.queries.push(`${plan.topic} case studies`);
        }
    }
    /**
     * Generate subtopics to explore
     */
    generateSubtopics(plan) {
        if (plan.depth > 1) {
            plan.subtopics.push(`${plan.topic} fundamentals`);
        }
        if (plan.depth > 2) {
            plan.subtopics.push(`${plan.topic} advanced topics`);
            plan.subtopics.push(`${plan.topic} applications`);
        }
        if (plan.depth > 3) {
            plan.subtopics.push(`${plan.topic} challenges`);
            plan.subtopics.push(`${plan.topic} future trends`);
        }
    }
    /**
     * Update plan status
     */
    updateStatus(topic, status) {
        const plan = this.plans.get(topic);
        if (plan) {
            plan.status = status;
        }
    }
    /**
     * Clear all plans
     */
    clear() {
        this.plans.clear();
    }
}
/**
 * Create a research plan (convenience function)
 */
export function createPlan(topic, depth = 3) {
    const planner = new ResearchPlanner();
    return planner.createPlan(topic, depth);
}
//# sourceMappingURL=planner.js.map