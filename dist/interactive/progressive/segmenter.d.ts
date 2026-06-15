/**
 * Section Segmenter - Splits reports into independently buildable sections
 */
import type { Section, SegmenterOptions } from './types.js';
import type { ProcessedFeedback } from '../feedback/types.js';
export declare class SectionSegmenter {
    private options;
    constructor(options?: Partial<SegmenterOptions>);
    segment(topic: string, outline?: string[]): Section[];
    resegment(sections: Section[], feedback: ProcessedFeedback): Section[];
    detectDependencies(sections: Section[]): Section[];
}
//# sourceMappingURL=segmenter.d.ts.map