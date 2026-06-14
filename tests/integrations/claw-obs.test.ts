import { describe, it, expect } from 'vitest';
import { ObservabilityIntegration, getObservability } from '../../src/integrations/claw-obs.js';

describe('ObservabilityIntegration', () => {
  let obs: ObservabilityIntegration;

  beforeEach(() => {
    obs = new ObservabilityIntegration(100);
  });

  describe('track', () => {
    it('should track events', () => {
      obs.track('test.event', { key: 'value' });
      obs.track('another.event', { count: 1 });

      const metrics = obs.getMetrics();
      expect(metrics.events).toBe(2);
    });

    it('should track errors', () => {
      obs.trackError('Something went wrong');
      obs.trackError(new Error('Another error'));

      const metrics = obs.getMetrics();
      expect(metrics.errors).toBe(2);
    });

    it('should track timing', () => {
      obs.trackTiming('search.duration', 1500);
      obs.trackTiming('search.duration', 2000);

      const metrics = obs.getMetrics();
      expect(metrics.duration).toBe(3500);
    });
  });

  describe('getMetrics', () => {
    it('should return metrics summary', () => {
      obs.track('event1', {});
      obs.track('event2', {});
      obs.track('event1', {});

      const metrics = obs.getMetrics();

      expect(metrics.events).toBe(3);
      expect(metrics.custom['event1']).toBe(2);
      expect(metrics.custom['event2']).toBe(1);
    });
  });

  describe('getEventsByName', () => {
    it('should filter events by name', () => {
      obs.track('search.start', {});
      obs.track('search.complete', {});
      obs.track('search.start', {});

      const events = obs.getEventsByName('search.start');
      expect(events.length).toBe(2);
    });
  });

  describe('getRecentEvents', () => {
    it('should return recent events', () => {
      for (let i = 0; i < 20; i++) {
        obs.track(`event-${i}`, {});
      }

      const recent = obs.getRecentEvents(5);
      expect(recent.length).toBe(5);
    });
  });

  describe('getUptime', () => {
    it('should return uptime', () => {
      const uptime = obs.getUptime();
      expect(uptime).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('getObservability', () => {
  it('should return singleton instance', () => {
    const o1 = getObservability();
    const o2 = getObservability();
    expect(o1).toBe(o2);
  });
});
