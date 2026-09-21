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
export declare function extractRelations(text: string): Relation[];
export declare function extractRelationsBetweenEntities(text: string, entities: Entity[]): Relation[];
export declare function extractEntitiesAndRelations(text: string): {
    entities: Entity[];
    relations: Relation[];
};
//# sourceMappingURL=rel-extract.d.ts.map