/**
 * Relation extraction between entities
 */

import type { Entity } from './ner.js';

export type RelationType =
  | 'WORKS_FOR'
  | 'LOCATED_IN'
  | 'EMPLOYS'
  | 'FOUNDED'
  | 'CEO_OF'
  | 'PART_OF'
  | 'RELATED_TO';

export interface Relation {
  source: string;
  type: RelationType;
  target: string;
  confidence: number;
}

// Relation patterns (simplified keyword-based)
const RELATION_PATTERNS: Array<{
  pattern: RegExp;
  type: RelationType;
  sourceGroup: number;
  targetGroup: number;
}> = [
  {
    pattern: /([A-Z][a-z]+ [A-Z][a-z]+) (?:works?|is working) (?:at|for) ([A-Z][A-Za-z]+)/i,
    type: 'WORKS_FOR',
    sourceGroup: 1,
    targetGroup: 2,
  },
  {
    pattern: /([A-Z][A-Za-z]+) (?:is )?located in ([A-Z][a-z]+)/i,
    type: 'LOCATED_IN',
    sourceGroup: 1,
    targetGroup: 2,
  },
  {
    pattern: /([A-Z][A-Za-z]+) (?:employs|hires) ([A-Z][a-z]+ [A-Z][a-z]+)/i,
    type: 'EMPLOYS',
    sourceGroup: 1,
    targetGroup: 2,
  },
  {
    pattern: /([A-Z][a-z]+ [A-Z][a-z]+) (?:founded|co-founded) ([A-Z][A-Za-z]+)/i,
    type: 'FOUNDED',
    sourceGroup: 1,
    targetGroup: 2,
  },
  {
    pattern: /([A-Z][a-z]+ [A-Z][a-z]+) (?:is )?(?:the )?CEO of ([A-Z][A-Za-z]+)/i,
    type: 'CEO_OF',
    sourceGroup: 1,
    targetGroup: 2,
  },
  {
    pattern: /([A-Z][A-Za-z]+) (?:is )?(?:a )?part of ([A-Z][A-Za-z]+)/i,
    type: 'PART_OF',
    sourceGroup: 1,
    targetGroup: 2,
  },
];

/**
 * Extract relations from text
 */
export function extractRelations(text: string): Relation[] {
  const relations: Relation[] = [];

  for (const { pattern, type, sourceGroup, targetGroup } of RELATION_PATTERNS) {
    pattern.lastIndex = 0;

    let match;
    while ((match = pattern.exec(text)) !== null) {
      const sourceText = match[sourceGroup];
      const targetText = match[targetGroup];

      if (sourceText && targetText) {
        relations.push({
          source: sourceText,
          type,
          target: targetText,
          confidence: 0.7,
        });
      }
    }
  }

  return relations;
}

/**
 * Extract relations between given entities
 */
export function extractRelationsBetweenEntities(
  text: string,
  entities: Entity[]
): Relation[] {
  const relations: Relation[] = [];

  // Look for entities that appear close to each other
  for (let i = 0; i < entities.length; i++) {
    const sourceEntity = entities[i];
    if (!sourceEntity) continue;

    for (let j = i + 1; j < entities.length; j++) {
      const targetEntity = entities[j];
      if (!targetEntity) continue;

      // Check if entities are within reasonable distance
      if (targetEntity.start - sourceEntity.end > 100) continue;

      // Get text between entities
      const betweenText = text.slice(sourceEntity.end, targetEntity.start).toLowerCase();

      // Determine relation type based on connecting words
      let relationType: RelationType | null = null;
      let confidence = 0.5;

      if (betweenText.includes(' works at ') || betweenText.includes(' works for ')) {
        relationType = 'WORKS_FOR';
        confidence = 0.8;
      } else if (betweenText.includes(' located in ')) {
        relationType = 'LOCATED_IN';
        confidence = 0.8;
      } else if (betweenText.includes(' ceo of ')) {
        relationType = 'CEO_OF';
        confidence = 0.8;
      } else if (betweenText.includes(' founded ')) {
        relationType = 'FOUNDED';
        confidence = 0.8;
      } else if (betweenText.length < 20) {
        // Close proximity suggests relation
        relationType = 'RELATED_TO';
        confidence = 0.5;
      }

      if (relationType) {
        relations.push({
          source: sourceEntity.text,
          type: relationType,
          target: targetEntity.text,
          confidence,
        });
      }
    }
  }

  return relations;
}

/**
 * Combined entity and relation extraction
 */
export async function extractEntitiesAndRelations(text: string): Promise<{
  entities: Entity[];
  relations: Relation[];
}> {
  const { extractEntities } = await import('./ner.js');

  const entities = extractEntities(text);
  const patternRelations = extractRelations(text);
  const entityRelations = extractRelationsBetweenEntities(text, entities);

  return {
    entities,
    relations: [...patternRelations, ...entityRelations],
  };
}
