import { describe, it, expect, vi } from 'vitest';
import { generateReport } from '../../src/report/index.js';

describe('Report Module', () => {
  describe('generateReport', () => {
    it('should generate a report with default options', async () => {
      const report = await generateReport('test-id', {});

      expect(report).toBeDefined();
      expect(report.id).toBe('test-id');
      expect(report.title).toContain('test-id');
      expect(report.format).toBe('markdown');
      expect(report.createdAt).toBeInstanceOf(Date);
    });

    it('should generate a report with custom format', async () => {
      const report = await generateReport('test-id', { format: 'html' });

      expect(report.format).toBe('html');
    });

    it('should generate report with unique id if not provided', async () => {
      const report = await generateReport(undefined, {});

      expect(report.id).toBeDefined();
      expect(report.id.length).toBeGreaterThan(0);
    });

    it('should include markdown content', async () => {
      const report = await generateReport('test-id', {});

      expect(report.content).toContain('# Research Report');
      expect(report.content).toContain('test-id');
    });
  });
});
