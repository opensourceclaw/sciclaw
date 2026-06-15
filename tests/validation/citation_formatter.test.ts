import { describe, it, expect } from 'vitest';
import { CitationFormatter, formatCitation, formatBibliography } from '../../src/validation/citation_formatter.js';
import { CitationStyle } from '../../src/validation/types.js';

const mockCitation = {
  url: 'https://example.com/article',
  title: 'Test Article Title',
  sourceId: 'abc12345',
  domain: 'example.com',
  publishedDate: new Date('2024-03-15'),
  accessedDate: new Date(),
  qualityScore: 0.8,
  relevantSnippet: 'Important content',
  author: 'John Smith',
  siteName: 'Example Site',
  metadata: {},
};

describe('CitationFormatter', () => {
  const formatter = new CitationFormatter();

  it('should format APA citation', () => {
    const result = formatter.format(mockCitation, CitationStyle.APA);
    expect(result).toContain('Smith');
    expect(result).toContain('2024');
    expect(result).toContain('Test Article Title');
    expect(result).toContain('https://example.com/article');
  });

  it('should format MLA citation', () => {
    const result = formatter.format(mockCitation, CitationStyle.MLA);
    expect(result).toContain('Smith');
    expect(result).toContain('Test Article Title');
    expect(result).toContain('Mar. 15, 2024');
  });

  it('should format Chicago citation', () => {
    const result = formatter.format(mockCitation, CitationStyle.CHICAGO);
    expect(result).toContain('Smith');
    expect(result).toContain('Test Article Title');
    expect(result).toContain('Last modified');
  });

  it('should use default APA style', () => {
    const result = formatter.format(mockCitation);
    expect(result).toContain('Smith');
    expect(result).toContain('(2024)');
  });

  it('should handle missing author', () => {
    const noAuthor = { ...mockCitation, author: undefined };
    const result = formatter.format(noAuthor, CitationStyle.APA);
    expect(result).toContain('Unknown');
  });

  it('should handle missing date', () => {
    const noDate = { ...mockCitation, publishedDate: undefined };
    const apa = formatter.format(noDate, CitationStyle.APA);
    expect(apa).toContain('n.d.');
  });

  it('should format in-text APA end position', () => {
    const result = formatter.formatInText(mockCitation, CitationStyle.APA, 'end');
    expect(result).toBe('(Smith, 2024)');
  });

  it('should format in-text APA narrative position', () => {
    const result = formatter.formatInText(mockCitation, CitationStyle.APA, 'nar');
    expect(result).toBe('Smith (2024)');
  });

  it('should format in-text MLA end position', () => {
    const result = formatter.formatInText(mockCitation, CitationStyle.MLA, 'end');
    expect(result).toBe('(Smith)');
  });

  it('should format in-text Chicago end position with note number', () => {
    const result = formatter.formatInText(mockCitation, CitationStyle.CHICAGO, 'end', 3);
    expect(result).toBe('Note 3.');
  });

  it('should extract last name from comma-separated author', () => {
    const commaAuthor = { ...mockCitation, author: 'Smith, John' };
    const result = formatter.formatInText(commaAuthor, CitationStyle.APA, 'end');
    expect(result).toBe('(Smith, 2024)');
  });

  it('should format bibliography', () => {
    const bib = formatter.formatBibliography([mockCitation], CitationStyle.APA);
    expect(bib).toContain('References');
    expect(bib).toContain('Smith');
  });

  it('should use MLA bibliography header', () => {
    const bib = formatter.formatBibliography([mockCitation], CitationStyle.MLA);
    expect(bib).toContain('Works Cited');
  });

  it('should use Chicago bibliography header', () => {
    const bib = formatter.formatBibliography([mockCitation], CitationStyle.CHICAGO);
    expect(bib).toContain('Bibliography');
  });
});

describe('formatCitation (standalone)', () => {
  it('should work as standalone function', () => {
    const result = formatCitation(mockCitation);
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });
});

describe('formatBibliography (standalone)', () => {
  it('should work as standalone function', () => {
    const result = formatBibliography([mockCitation]);
    expect(result).toContain('References');
  });
});
