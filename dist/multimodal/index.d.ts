import type { ImageContent, TableData, ChartData, PDFContent, MultiModalConfig } from "./types.js";
import { ImageProcessor } from "./image.js";
import { TableExtractor } from "./table.js";
import { ChartParser } from "./chart.js";
import { PDFAnalyzer } from "./pdf.js";
export * from "./types.js";
export * from "./image.js";
export * from "./table.js";
export * from "./chart.js";
export * from "./pdf.js";
export interface MultiModalProcessorConfig {
    image?: Partial<MultiModalConfig["image"]>;
    table?: Partial<MultiModalConfig["table"]>;
    chart?: Partial<MultiModalConfig["chart"]>;
    pdf?: Partial<MultiModalConfig["pdf"]>;
}
export declare class MultiModalProcessor {
    private imageProcessor;
    private tableExtractor;
    private chartParser;
    private pdfAnalyzer;
    constructor(config?: MultiModalProcessorConfig);
    processImage(input: string | Buffer): Promise<ImageContent>;
    extractTable(input: string): TableData;
    parseChart(input: string | Buffer): Promise<ChartData>;
    analyzePDF(input: string | Buffer): Promise<PDFContent>;
    processBatch(inputs: Array<{
        type: "image" | "table" | "chart" | "pdf";
        data: string | Buffer;
    }>): Promise<Array<ImageContent | TableData | ChartData | PDFContent>>;
    autoProcess(input: string | Buffer): Promise<{
        type: "image" | "table" | "chart" | "pdf";
        result: ImageContent | TableData | ChartData | PDFContent;
    }>;
    getStats(): {
        images: number;
        tables: number;
        charts: number;
        pdfs: number;
    };
    getImageProcessor(): ImageProcessor;
    getTableExtractor(): TableExtractor;
    getChartParser(): ChartParser;
    getPDFAnalyzer(): PDFAnalyzer;
}
export declare function createMultiModalProcessor(config?: MultiModalProcessorConfig): MultiModalProcessor;
//# sourceMappingURL=index.d.ts.map