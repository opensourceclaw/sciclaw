/**
 * Skill module - OpenClaw Skill Integration for DeepClaw
 */
export declare enum ResearchDepth {
    QUICK = "quick",
    STANDARD = "standard",
    DEEP = "deep"
}
export declare enum OutputFormat {
    MARKDOWN = "markdown",
    HTML = "html",
    PDF = "pdf"
}
export interface ResearchRequest {
    topic: string;
    depth: ResearchDepth;
    maxSources: number;
    language: string;
    outputFormat: OutputFormat;
}
export interface SkillResearchResult {
    request: ResearchRequest;
    report?: string;
    sources: string[];
    status: string;
    error?: string;
}
export declare abstract class BaseResearchSkill {
    abstract name: string;
    abstract version: string;
    abstract description: string;
    abstract initialize(): boolean;
    abstract execute(request: ResearchRequest): SkillResearchResult;
    abstract getStatus(): Record<string, unknown>;
    abstract shutdown(): boolean;
}
export declare class ResearchSkill extends BaseResearchSkill {
    name: string;
    version: string;
    description: string;
    private initialized;
    private researchResults;
    initialize(): boolean;
    execute(request: ResearchRequest): SkillResearchResult;
    getStatus(): Record<string, unknown>;
    shutdown(): boolean;
    getResult(resultId: string): SkillResearchResult | undefined;
    listResults(): Array<{
        id: string;
        status: string;
        topic: string;
    }>;
}
//# sourceMappingURL=index.d.ts.map