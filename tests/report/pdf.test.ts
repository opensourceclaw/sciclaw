import { describe, it, expect, vi } from 'vitest';
import { generatePDF, generatePDFFromHTML } from '../../src/report/pdf.js';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const testDir = join(tmpdir(), 'deepclaw-pdf-test');

describe('PDF Generator', () => {
  beforeAll(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterAll(() => {
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {}
  });

  describe('generatePDF', () => {
    it('should generate a PDF file from markdown', async () => {
      const outputPath = join(testDir, 'test.pdf');
      const markdown = `# Test Report

This is a test paragraph.

## Section 1

- Item 1
- Item 2

### Subsection

More content here.
`;

      await generatePDF(markdown, outputPath);

      // Check file was created
      const fs = await import('fs/promises');
      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(0);
    });

    it('should handle custom options', async () => {
      const outputPath = join(testDir, 'test-options.pdf');
      const markdown = '# Custom Report\n\nContent here.';

      await generatePDF(markdown, outputPath, {
        title: 'Custom Title',
        author: 'Test Author',
        pageSize: 'Letter',
      });

      const fs = await import('fs/promises');
      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(0);
    });
  });

  describe('generatePDFFromHTML', () => {
    it('should generate PDF from HTML content', async () => {
      const outputPath = join(testDir, 'test-html.pdf');
      const html = `
        <h1>HTML Report</h1>
        <p>This is a paragraph.</p>
        <h2>Section</h2>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
      `;

      await generatePDFFromHTML(html, outputPath);

      const fs = await import('fs/promises');
      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(0);
    });
  });
});
