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
export class ResearchPlanner {
  private plans: Map<string, ResearchPlan> = new Map();

  /**
   * Create a research plan for a topic
   */
  createPlan(topic: string, depth: number = 3): ResearchPlan {
    const plan: ResearchPlan = {
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
  getPlan(topic: string): ResearchPlan | undefined {
    return this.plans.get(topic);
  }

  /**
   * Generate search queries for the topic
   */
  private generateQueries(plan: ResearchPlan): void {
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
  private generateSubtopics(plan: ResearchPlan): void {
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
  updateStatus(topic: string, status: ResearchPlan["status"]): void {
    const plan = this.plans.get(topic);
    if (plan) {
      plan.status = status;
    }
  }

  /**
   * Clear all plans
   */
  clear(): void {
    this.plans.clear();
  }
}

/**
 * Create a research plan (convenience function)
 */
export function createPlan(topic: string, depth: number = 3): ResearchPlan {
  const planner = new ResearchPlanner();
  return planner.createPlan(topic, depth);
}