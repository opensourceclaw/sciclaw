/**
 * PDF Generator - Generate PDF reports from markdown content
 */

import PDFDocument from 'pdfkit';
import { marked } from 'marked';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';

export interface PDFOptions {
  title?: string;
  author?: string;
  pageSize?: 'A4' | 'Letter';
  margins?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

const defaultOptions: PDFOptions = {
  title: 'SciClaw Report',
  author: 'SciClaw',
  pageSize: 'A4',
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
};

/**
 * Generate PDF from markdown content
 */
export async function generatePDF(
  markdown: string,
  outputPath: string,
  options: PDFOptions = {}
): Promise<void> {
  const opts = { ...defaultOptions, ...options };

  // Ensure output directory exists
  await mkdir(dirname(outputPath), { recursive: true });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: opts.pageSize,
      margins: opts.margins,
      info: {
        Title: opts.title,
        Author: opts.author,
      },
    });

    const stream = createWriteStream(outputPath);
    doc.pipe(stream);

    // Parse markdown to plain text (simplified)
    const lines = markdown.split('\n');
    let y = doc.y;

    for (const line of lines) {
      // Handle headers
      if (line.startsWith('# ')) {
        doc.fontSize(24).font('Helvetica-Bold').text(line.slice(2), { underline: true });
        doc.moveDown(0.5);
      } else if (line.startsWith('## ')) {
        doc.fontSize(18).font('Helvetica-Bold').text(line.slice(3));
        doc.moveDown(0.3);
      } else if (line.startsWith('### ')) {
        doc.fontSize(14).font('Helvetica-Bold').text(line.slice(4));
        doc.moveDown(0.2);
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        // Bullet points
        doc.fontSize(11).font('Helvetica').text('• ' + line.slice(2), { indent: 20 });
      } else if (line.trim().length > 0) {
        // Regular text
        doc.fontSize(11).font('Helvetica').text(line);
      } else {
        // Empty line
        doc.moveDown(0.2);
      }

      // Check if we need a new page
      if (doc.y > doc.page.height - opts.margins!.bottom - 50) {
        doc.addPage();
      }
    }

    doc.end();

    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

/**
 * Generate PDF from HTML content (simplified)
 */
export async function generatePDFFromHTML(
  html: string,
  outputPath: string,
  options: PDFOptions = {}
): Promise<void> {
  // Convert HTML to simplified text
  const text = html
    .replace(/<h1[^>]*>([^<]*)<\/h1>/gi, '\n# $1\n')
    .replace(/<h2[^>]*>([^<]*)<\/h2>/gi, '\n## $1\n')
    .replace(/<h3[^>]*>([^<]*)<\/h3>/gi, '\n### $1\n')
    .replace(/<p[^>]*>([^<]*)<\/p>/gi, '$1\n')
    .replace(/<li[^>]*>([^<]*)<\/li>/gi, '- $1\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();

  return generatePDF(text, outputPath, options);
}

export { generatePDF as default };
