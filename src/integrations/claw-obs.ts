/**
 * claw-obs integration - Observability and monitoring
 */

import type { ObsEvent, ObsMetrics } from './types.js';

export class ObservabilityIntegration {
  private events: ObsEvent[] = [];
  private maxEvents: number;
  private startTime: number;

  constructor(maxEvents: number = 1000) {
    this.maxEvents = maxEvents;
    this.startTime = Date.now();
  }

  /**
   * Track an event
   */
  track(name: string, data: Record<string, unknown> = {}): void {
    // Evict oldest if at capacity
    if (this.events.length >= this.maxEvents) {
      this.events.shift();
    }

    this.events.push({
      name,
      timestamp: Date.now(),
      data,
    });
  }

  /**
   * Track a timing event
   */
  trackTiming(name: string, duration: number, data: Record<string, unknown> = {}): void {
    this.track(name, { ...data, duration });
  }

  /**
   * Track an error
   */
  trackError(error: string | Error, data: Record<string, unknown> = {}): void {
    const message = typeof error === 'string' ? error : error.message;
    this.track('error', { ...data, error: message });
  }

  /**
   * Get metrics summary
   */
  getMetrics(): ObsMetrics {
    const errors = this.events.filter((e) => e.name === 'error').length;

    // Calculate total duration from timing events
    let duration = 0;
    for (const event of this.events) {
      if (typeof event.data.duration === 'number') {
        duration += event.data.duration;
      }
    }

    // Custom metrics
    const custom: Record<string, number> = {};
    for (const event of this.events) {
      const key = event.name;
      custom[key] = (custom[key] ?? 0) + 1;
    }

    return {
      events: this.events.length,
      errors,
      duration,
      custom,
    };
  }

  /**
   * Get events by name
   */
  getEventsByName(name: string): ObsEvent[] {
    return this.events.filter((e) => e.name === name);
  }

  /**
   * Get recent events
   */
  getRecentEvents(count: number = 10): ObsEvent[] {
    return this.events.slice(-count);
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.events = [];
  }

  /**
   * Get uptime
   */
  getUptime(): number {
    return Date.now() - this.startTime;
  }
}

// Global instance
let globalObs: ObservabilityIntegration | null = null;

export function getObservability(maxEvents?: number): ObservabilityIntegration {
  if (!globalObs) {
    globalObs = new ObservabilityIntegration(maxEvents);
  }
  return globalObs;
}
