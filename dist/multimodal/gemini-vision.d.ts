import type { ChartData, DetectedObject } from "./types.js";
import { ContentCategory } from "./types.js";
export type GeminiModel = "gemini-2.5-flash" | "gemini-2.5-pro";
export interface GeminiVisionConfig {
    defaultModel: GeminiModel;
    proFallbackEnabled: boolean;
    proFallbackThreshold: number;
    maxProFallbacksPerSession: number;
}
export declare const DEFAULT_GEMINI_VISION_CONFIG: GeminiVisionConfig;
export interface ImageAnalysis {
    description: string;
    category: ContentCategory;
    objects: DetectedObject[];
    textContent: string;
    contextualInsights: string;
    confidence: number;
    model: GeminiModel;
}
export interface DiagramData {
    type: "flowchart" | "architecture" | "sequence" | "er" | "unknown";
    description: string;
    entities: string[];
    relationships: Array<{
        from: string;
        to: string;
        label: string;
    }>;
    confidence: number;
}
export interface ScreenshotData {
    description: string;
    uiElements: string[];
    textContent: string;
    context: string;
    confidence: number;
}
export declare class GeminiVisionAdapter {
    private adapter;
    private config;
    private proFallbackCount;
    constructor(adapterConfig?: Partial<{
        baseUrl: string;
        apiKey?: string;
        timeoutMs: number;
    }>, visionConfig?: Partial<GeminiVisionConfig>);
    /** Analyze an image with vision capabilities. */
    analyzeImage(image: Buffer, prompt?: string): Promise<ImageAnalysis>;
    /** Interpret a chart image (bar, line, pie, scatter). */
    interpretChart(image: Buffer): Promise<ChartData>;
    /** Parse a diagram (flowchart, architecture diagram). */
    readDiagram(image: Buffer): Promise<DiagramData>;
    /** Extract content from a screenshot. */
    extractScreenshot(image: Buffer): Promise<ScreenshotData>;
    getProFallbackCount(): number;
    resetProFallbackCount(): void;
    private callVision;
    private parseVisionResponse;
    private parseCategory;
    private parseChartResult;
    private parseChartType;
}
export declare function createGeminiVisionAdapter(adapterConfig?: Partial<{
    baseUrl: string;
    apiKey?: string;
    timeoutMs: number;
}>, visionConfig?: Partial<GeminiVisionConfig>): GeminiVisionAdapter;
//# sourceMappingURL=gemini-vision.d.ts.map