/**
 * Relation extraction between entities
 */
import type { Entity } from './ner.js';
export type RelationType = 'WORKS_FOR' | 'LOCATED_IN' | 'EMPLOYS' | 'FOUNDED' | 'CEO_OF' | 'PART_OF' | 'RELATED_TO';
export interface Relation {
    source: string;
    type: RelationType;
    target: string;
    confidence: number;
}
/**
 * Extract relations from text
 */
export declare function extractRelations(text: string): Relation[];
/**
 * Extract relations between given entities
 */
export declare function extractRelationsBetweenEntities(text: string, entities: Entity[]): Relation[];
/**
 * Combined entity and relation extraction
 */
export declare function extractEntitiesAndRelations(text: string): Promise<{
    entities: Entity[];
    relations: Relation[];
}>;
//# sourceMappingURL=relation.d.ts.map