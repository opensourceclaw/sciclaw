import { describe, it, expect } from 'vitest';
import { cleanHtml, extractText } from '../../src/tools/content_extraction.js';
import { buildSearchUrl } from '../../src/tools/web_search.js';
import { retry } from '../../src/tools/retry.js';

describe('Tools Module', () => {
  describe('Content Extraction', () => {
    it('should clean HTML by removing scripts and styles', () => {
      const html = '<script>var x = 1;</script><p>Content</p><style>.a { color: red; }</style>';
      const cleaned = cleanHtml(html);

      expect(cleaned).not.toContain('<script>');
      expect(cleaned).not.toContain('<style>');
      expect(cleaned).toContain('Content');
    });

    it('should remove HTML comments', () => {
      const html = '<!-- comment --><p>Content</p>';
      const cleaned = cleanHtml(html);

      expect(cleaned).not.toContain('<!--');
      expect(cleaned).toContain('Content');
    });

    it('should extract text from HTML', () => {
      const html = '<div><h1>Title</h1><p>Paragraph</p></div>';
      const text = extractText(html);

      expect(text).toContain('Title');
      expect(text).toContain('Paragraph');
      expect(text).not.toContain('<');
    });
  });

  describe('Web Search', () => {
    it('should build DuckDuckGo search URL', () => {
      const url = buildSearchUrl('duckduckgo', 'test query');
      expect(url).toContain('duckduckgo.com');
      expect(url).toContain('test%20query');
    });

    it('should build Google search URL', () => {
      const url = buildSearchUrl('google', 'test query');
      expect(url).toContain('google.com');
      expect(url).toContain('test%20query');
    });

    it('should build Bing search URL', () => {
      const url = buildSearchUrl('bing', 'test query');
      expect(url).toContain('bing.com');
      expect(url).toContain('test%20query');
    });

    it('should default to DuckDuckGo for unknown engine', () => {
      const url = buildSearchUrl('unknown', 'test');
      expect(url).toContain('duckduckgo.com');
    });
  });

  describe('Retry', () => {
    it('should succeed on first attempt', async () => {
      const fn = () => Promise.resolve('success');
      const result = await retry(fn);

      expect(result).toBe('success');
    });

    it('should retry on failure', async () => {
      let attempts = 0;
      const fn = () => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('Failed'));
        }
        return Promise.resolve('success');
      };

      const result = await retry(fn, { delay: 10 });

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should throw after max attempts', async () => {
      const fn = () => Promise.reject(new Error('Always fails'));

      await expect(retry(fn, { maxAttempts: 2, delay: 10 })).rejects.toThrow('Always fails');
    });
  });
});
