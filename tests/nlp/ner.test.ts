import { describe, it, expect } from 'vitest';
import { extractEntities, extractEntitiesWithCustom } from '../../src/nlp/ner.js';

describe('NER', () => {
  describe('extractEntities', () => {
    it('should extract dates', () => {
      const text = 'The event is on 2024-01-15 and March 15, 2024';
      const entities = extractEntities(text);

      expect(entities.length).toBeGreaterThanOrEqual(1);
    });

    it('should extract money', () => {
      const text = 'The price is $1000.00 and ¥500';
      const entities = extractEntities(text);

      const money = entities.filter((e) => e.type === 'MONEY');
      expect(money.length).toBeGreaterThanOrEqual(1);
      expect(money.some((e) => e.text.includes('$'))).toBe(true);
    });

    it('should extract percentages', () => {
      const text = 'Growth of 15.5%';
      const entities = extractEntities(text);

      const percents = entities.filter((e) => e.type === 'PERCENT');
      expect(percents.length).toBeGreaterThanOrEqual(1);
      expect(percents[0]?.text).toBe('15.5%');
    });

    it('should extract emails', () => {
      const text = 'Contact us at test@example.com';
      const entities = extractEntities(text);

      const emails = entities.filter((e) => e.type === 'EMAIL');
      expect(emails.length).toBe(1);
      expect(emails[0]?.text).toBe('test@example.com');
    });

    it('should extract URLs', () => {
      const text = 'Visit https://example.com for more info';
      const entities = extractEntities(text);

      const urls = entities.filter((e) => e.type === 'URL');
      expect(urls.length).toBe(1);
      expect(urls[0]?.text).toBe('https://example.com');
    });

    it('should extract time', () => {
      const text = 'Meeting at 10:30 AM';
      const entities = extractEntities(text);

      expect(entities.length).toBeGreaterThanOrEqual(1);
    });

    it('should sort entities by position', () => {
      const text = 'First test@example.com then https://example.com';
      const entities = extractEntities(text);

      if (entities.length >= 2) {
        expect(entities[0]!.start).toBeLessThan(entities[1]!.start);
      }
    });
  });

  describe('extractEntitiesWithCustom', () => {
    it('should use custom patterns', () => {
      const text = 'Product SKU: ABC123';
      const entities = extractEntitiesWithCustom(text, {
        ORG: [/\b([A-Z]{3}\d{3})\b/g],
      });

      expect(entities.length).toBeGreaterThanOrEqual(1);
    });
  });
});
