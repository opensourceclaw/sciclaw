/**
 * Progressive Builder - Incrementally builds report sections
 */
import type { Section, SectionResult, BuilderOptions } from './types.js';
export declare class ProgressiveBuilder {
    private results;
    private options;
    constructor(options?: Partial<BuilderOptions>);
    build(section: Section, context?: string): Promise<SectionResult>;
    buildBatch(sections: Section[]): Promise<SectionResult[]>;
    rebuild(sectionId: string): Promise<SectionResult>;
    getResult(sectionId: string): SectionResult | undefined;
    getAllResults(): SectionResult[];
    private getContext;
}
//# sourceMappingURL=builder.d.ts.map