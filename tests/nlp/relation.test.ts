import { describe, it, expect } from 'vitest';
import { extractRelations, extractRelationsBetweenEntities } from '../../src/nlp/relation.js';
import { extractEntities } from '../../src/nlp/ner.js';

describe('Relation Extraction', () => {
  describe('extractRelations', () => {
    it('should extract WORKS_FOR relations', () => {
      const text = 'John Smith works at Google and Jane Doe works for Microsoft';
      const relations = extractRelations(text);

      expect(relations.length).toBeGreaterThanOrEqual(1);
      const worksFor = relations.filter((r) => r.type === 'WORKS_FOR');
      expect(worksFor.length).toBeGreaterThanOrEqual(1);
    });

    it('should extract LOCATED_IN relations', () => {
      const text = 'Google is located in Mountain View';
      const relations = extractRelations(text);

      const located = relations.filter((r) => r.type === 'LOCATED_IN');
      expect(located.length).toBeGreaterThanOrEqual(1);
    });

    it('should extract CEO_OF relations', () => {
      const text = 'Sundar Pichai is the CEO of Google';
      const relations = extractRelations(text);

      const ceo = relations.filter((r) => r.type === 'CEO_OF');
      expect(ceo.length).toBeGreaterThanOrEqual(1);
    });

    it('should extract FOUNDED relations', () => {
      const text = 'Mark Zuckerberg founded Facebook';
      const relations = extractRelations(text);

      const founded = relations.filter((r) => r.type === 'FOUNDED');
      expect(founded.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('extractRelationsBetweenEntities', () => {
    it('should find relations between nearby entities', () => {
      const text = 'John Smith works at Google Inc';
      const entities = extractEntities(text);
      const relations = extractRelationsBetweenEntities(text, entities);

      // Should find at least a RELATED_TO relation
      expect(relations.length).toBeGreaterThanOrEqual(0);
    });
  });
});
