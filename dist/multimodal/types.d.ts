/**
 * DeepClaw v3.0.0 — Multi-Modal Types
 */
export declare enum ImageFormat {
    JPEG = "jpeg",
    PNG = "png",
    WEBP = "webp",
    GIF = "gif",
    BMP = "bmp",
    SVG = "svg"
}
export declare enum ChartType {
    BAR = "bar",
    LINE = "line",
    PIE = "pie",
    SCATTER = "scatter",
    AREA = "area",
    HISTOGRAM = "histogram",
    UNKNOWN = "unknown"
}
export declare enum TableFormat {
    HTML = "html",
    MARKDOWN = "markdown",
    CSV = "csv",
    JSON = "json"
}
export declare enum ContentCategory {
    PHOTOGRAPH = "photograph",
    DIAGRAM = "diagram",
    CHART = "chart",
    SCREENSHOT = "screenshot",
    DOCUMENT = "document",
    UNKNOWN = "unknown"
}
export interface ImageMetadata {
    format: ImageFormat;
    width: number;
    height: number;
    fileSizeBytes: number;
    colorSpace?: "RGB" | "CMYK" | "Grayscale";
    hasAlpha?: boolean;
    dpi?: number;
}
export interface DetectedObject {
    label: string;
    confidence: number;
    boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}
export interface ImageContent {
    metadata: ImageMetadata;
    category: ContentCategory;
    description: string;
    textContent: string;
    objects: DetectedObject[];
    dominantColors: string[];
    confidence: number;
}
export interface TableData {
    headers: string[];
    rows: string[][];
    caption?: string;
    sourceFormat: TableFormat;
    rowCount: number;
    columnCount: number;
    hasNumericData: boolean;
    extractionConfidence: number;
}
export interface ChartDataset {
    label: string;
    values: number[];
    color?: string;
}
export interface ChartData {
    type: ChartType;
    title?: string;
    labels: string[];
    datasets: ChartDataset[];
    axes: {
        xLabel?: string;
        yLabel?: string;
    };
    legend?: string[];
    rawDescription: string;
    extractionConfidence: number;
}
export interface PDFPage {
    pageNumber: number;
    text: string;
    tables: TableData[];
    images: ImageContent[];
    wordCount: number;
}
export interface PDFMetadata {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
    pageCount: number;
}
export interface PDFContent {
    totalPages: number;
    title?: string;
    author?: string;
    pages: PDFPage[];
    metadata: PDFMetadata;
    extractionConfidence: number;
}
export interface MultiModalConfig {
    image: {
        maxFileSizeBytes: number;
        supportedFormats: ImageFormat[];
        maxDescriptionLength: number;
        ocrEnabled: boolean;
    };
    table: {
        maxRows: number;
        maxColumns: number;
        supportedFormats: TableFormat[];
    };
    chart: {
        supportedTypes: ChartType[];
        maxDataPoints: number;
    };
    pdf: {
        maxPages: number;
        maxFileSizeBytes: number;
        extractTables: boolean;
        extractImages: boolean;
    };
}
export declare const DEFAULT_MULTIMODAL_CONFIG: MultiModalConfig;
//# sourceMappingURL=types.d.ts.map