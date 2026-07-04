export type InputType = "image" | "pdf" | "table" | "chart" | "text";
export interface MultiModalInput {
    type: InputType;
    data: Buffer | string;
    metadata?: Record<string, unknown>;
}
export interface ExtractedContent {
    type: InputType;
    text: string;
    structured?: Record<string, unknown>;
    confidence: number;
}
export interface ModalResult {
    id: string;
    inputType: InputType;
    extracted: ExtractedContent;
    source: string;
    confidence: number;
}
export type LinkRelation = "supports" | "contradicts" | "extends" | "illustrates";
export interface CrossModalLink {
    id: string;
    source: ModalResult;
    target: ModalResult;
    relation: LinkRelation;
    confidence: number;
    explanation: string;
}
export interface ReportSection {
    title: string;
    content: string;
    sourceResults: string[];
    confidence: number;
}
export interface MultiModalReport {
    summary: string;
    sections: ReportSection[];
    links: CrossModalLink[];
    unresolvedConflicts: CrossModalLink[];
    overallConfidence: number;
}
export interface SynthesizerConfig {
    minLinkConfidence: number;
    maxSections: number;
    summaryMaxLength: number;
}
export declare class MultiModalSynthesizer {
    private config;
    constructor(config?: Partial<SynthesizerConfig>);
    /**
     * Synthesize multiple modal results into a unified report.
     *
     * Pipeline:
     *   1. Normalize all inputs into ModalResults
     *   2. Link related results across modalities
     *   3. Resolve contradictions
     *   4. Generate report sections
     *   5. Assemble final report
     */
    synthesize(results: ModalResult[]): MultiModalReport;
    /** Link related results across modalities using text similarity. */
    linkCrossModal(results: ModalResult[]): CrossModalLink[];
    /** Resolve contradictory links. */
    resolveConflicts(links: CrossModalLink[]): {
        resolved: CrossModalLink[];
        unresolved: CrossModalLink[];
    };
    /** Generate report sections grouped by topic/theme. */
    private generateSections;
    /** Generate an executive summary. */
    private generateSummary;
    private determineRelation;
    private buildLinkExplanation;
    private computeOverallConfidence;
}
export declare function createMultiModalSynthesizer(config?: Partial<SynthesizerConfig>): MultiModalSynthesizer;
//# sourceMappingURL=synthesizer.d.ts.map