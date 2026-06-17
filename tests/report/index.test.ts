import { describe, it, expect } from 'vitest';
import { generateReport, generatePDFReport } from '../../src/report/index.js';

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

    it('should generate HTML report with HTML tags', async () => {
      const report = await generateReport('html-test', { format: 'html' });
      expect(report.format).toBe('html');
      expect(report.content).toContain('<h1>');
      expect(report.content).toContain('<strong>');
    });

    it('should generate PDF report with outputPath', async () => {
      const report = await generateReport('pdf-test', {
        format: 'pdf',
        outputPath: '/tmp/deepclaw-test-report.pdf',
      });
      expect(report.format).toBe('pdf');
      expect(report.pdfPath).toBe('/tmp/deepclaw-test-report.pdf');
    });
  });

  describe('generatePDFReport', () => {
    it('should generate PDF with given id', async () => {
      const result = await generatePDFReport('pdf-id', '/tmp/test.pdf');
      expect(result.id).toBe('pdf-id');
      expect(result.path).toBe('/tmp/test.pdf');
    });

    it('should auto-generate id when undefined', async () => {
      const result = await generatePDFReport(undefined, '/tmp/auto.pdf');
      expect(result.id).toBeDefined();
      expect(result.id.length).toBeGreaterThan(0);
      expect(result.path).toBe('/tmp/auto.pdf');
    });
  });
});
