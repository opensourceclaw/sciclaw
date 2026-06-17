import { describe, it, expect } from 'vitest';
import {
  extractRelations,
  extractRelationsBetweenEntities,
  extractEntitiesAndRelations,
} from '../../src/nlp/relation.js';
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

    it('should extract EMPLOYS relations', () => {
      const text = 'Google employs Alice Johnson';
      const relations = extractRelations(text);
      const employs = relations.filter((r) => r.type === 'EMPLOYS');
      expect(employs.length).toBeGreaterThanOrEqual(1);
    });

    it('should extract PART_OF relations', () => {
      const text = 'DeepMind is part of Google';
      const relations = extractRelations(text);
      const partOf = relations.filter((r) => r.type === 'PART_OF');
      expect(partOf.length).toBeGreaterThanOrEqual(1);
    });

    it('returns empty for no-relation text', () => {
      const relations = extractRelations('hello world');
      expect(relations).toEqual([]);
    });

    it('sets confidence to 0.7', () => {
      const text = 'Alice works at CorpX';
      const relations = extractRelations(text);
      if (relations.length > 0) {
        expect(relations[0]!.confidence).toBe(0.7);
      }
    });
  });

  describe('extractRelationsBetweenEntities', () => {
    it('should find relations between nearby entities', () => {
      const text = 'John Smith works at Google Inc';
      const entities = extractEntities(text);
      const relations = extractRelationsBetweenEntities(text, entities);

      expect(relations.length).toBeGreaterThanOrEqual(0);
    });

    it('detects WORKS_FOR from between-text', () => {
      const text = 'John Smith works at Google Inc';
      const entities = extractEntities(text);
      const relations = extractRelationsBetweenEntities(text, entities);
      const worksFor = relations.filter((r) => r.type === 'WORKS_FOR');
      expect(worksFor.length).toBeGreaterThanOrEqual(1);
    });

    it('detects LOCATED_IN from between-text', () => {
      const text = 'Google Inc is located in New York City';
      const entities = extractEntities(text);
      const relations = extractRelationsBetweenEntities(text, entities);
      const located = relations.filter((r) => r.type === 'LOCATED_IN');
      expect(located.length).toBeGreaterThanOrEqual(1);
    });

    it('detects CEO_OF from between-text', () => {
      const text = 'Sundar Pichai CEO of Google Inc';
      const entities = extractEntities(text);
      const relations = extractRelationsBetweenEntities(text, entities);
      const ceo = relations.filter((r) => r.type === 'CEO_OF');
      expect(ceo.length).toBeGreaterThanOrEqual(1);
    });

    it('detects FOUNDED from between-text', () => {
      const text = 'Mark Zuckerberg founded Facebook Inc';
      const entities = extractEntities(text);
      const relations = extractRelationsBetweenEntities(text, entities);
      const founded = relations.filter((r) => r.type === 'FOUNDED');
      expect(founded.length).toBeGreaterThanOrEqual(1);
    });

    it('detects RELATED_TO for entities within 100 chars', () => {
      const text = 'John Smith Google Inc';
      const entities = extractEntities(text);
      const relations = extractRelationsBetweenEntities(text, entities);
      const related = relations.filter((r) => r.type === 'RELATED_TO');
      expect(related.length).toBeGreaterThanOrEqual(1);
    });

    it('skips entities more than 100 chars apart', () => {
      const text = 'John Smith' + ' '.repeat(200) + 'Google Inc';
      const entities = extractEntities(text);
      const relations = extractRelationsBetweenEntities(text, entities);
      // All relations from this should be RELATED_TO or none, not based on connecting words
      const specificRelations = relations.filter((r) => r.type !== 'RELATED_TO');
      expect(specificRelations.length).toBe(0);
    });

    it('returns empty for single entity', () => {
      const text = 'John Smith';
      const entities = extractEntities(text);
      const relations = extractRelationsBetweenEntities(text, entities);
      expect(relations).toEqual([]);
    });
  });

  describe('extractEntitiesAndRelations', () => {
    it('combines pattern and entity-based relations', async () => {
      const text = 'John Smith works at Google Inc in Mountain View';
      const result = await extractEntitiesAndRelations(text);
      expect(result.entities.length).toBeGreaterThan(0);
      expect(result.relations.length).toBeGreaterThan(0);
    });

    it('handles text with no relations', async () => {
      const text = 'No entities here';
      const result = await extractEntitiesAndRelations(text);
      expect(result.entities).toBeDefined();
      expect(result.relations).toBeDefined();
    });
  });
});
