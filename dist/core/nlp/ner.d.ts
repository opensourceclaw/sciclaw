/**
 * Named Entity Recognition (NER)
 */
export type EntityType = 'PERSON' | 'ORG' | 'LOC' | 'DATE' | 'TIME' | 'MONEY' | 'PERCENT' | 'EMAIL' | 'URL';
export interface Entity {
    text: string;
    type: EntityType;
    start: number;
    end: number;
    confidence: number;
}
/**
 * Extract entities from text
 */
export declare function extractEntities(text: string): Entity[];
/**
 * Extract entities with custom patterns
 */
export declare function extractEntitiesWithCustom(text: string, customPatterns: Partial<Record<EntityType, RegExp[]>>): Entity[];
//# sourceMappingURL=ner.d.ts.map