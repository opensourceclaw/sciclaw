/**
 * SciClaw v3.0.0 — Image Processor
 *
 * Detects image formats via magic bytes, extracts metadata,
 * categorizes content, and extracts descriptions/text/objects/colors.
 */
import { ImageFormat, ContentCategory } from "./types.js";
import type { ImageMetadata, ImageContent, DetectedObject, MultiModalConfig } from "./types.js";
export declare class ImageProcessor {
    private config;
    private totalProcessed;
    private formatDistribution;
    private totalProcessingTime;
    constructor(config?: Partial<MultiModalConfig["image"]>);
    processImage(input: string | Buffer): Promise<ImageContent>;
    processBatch(inputs: Array<string | Buffer>): Promise<ImageContent[]>;
    detectFormat(input: string | Buffer): ImageFormat;
    getMetadata(input: string | Buffer): Promise<ImageMetadata>;
    categorizeContent(metadata: ImageMetadata, description: string): ContentCategory;
    extractDescription(input: string | Buffer): Promise<string>;
    extractText(input: string | Buffer): Promise<string>;
    detectObjects(input: string | Buffer): Promise<DetectedObject[]>;
    extractDominantColors(input: string | Buffer): Promise<string[]>;
    validateFormat(format: string): format is ImageFormat;
    validateSize(fileSizeBytes: number): boolean;
    getProcessorStats(): {
        totalProcessed: number;
        formatDistribution: Record<string, number>;
        avgProcessingTimeMs: number;
    };
}
export declare function createImageProcessor(config?: Partial<MultiModalConfig["image"]>): ImageProcessor;
//# sourceMappingURL=image.d.ts.map