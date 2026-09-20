/**
 * SciClaw v3.0.0 — Multi-Modal Types
 */
// ── Enums ────────────────────────────────────────────────────────────────
export var ImageFormat;
(function (ImageFormat) {
    ImageFormat["JPEG"] = "jpeg";
    ImageFormat["PNG"] = "png";
    ImageFormat["WEBP"] = "webp";
    ImageFormat["GIF"] = "gif";
    ImageFormat["BMP"] = "bmp";
    ImageFormat["SVG"] = "svg";
})(ImageFormat || (ImageFormat = {}));
export var ChartType;
(function (ChartType) {
    ChartType["BAR"] = "bar";
    ChartType["LINE"] = "line";
    ChartType["PIE"] = "pie";
    ChartType["SCATTER"] = "scatter";
    ChartType["AREA"] = "area";
    ChartType["HISTOGRAM"] = "histogram";
    ChartType["UNKNOWN"] = "unknown";
})(ChartType || (ChartType = {}));
export var TableFormat;
(function (TableFormat) {
    TableFormat["HTML"] = "html";
    TableFormat["MARKDOWN"] = "markdown";
    TableFormat["CSV"] = "csv";
    TableFormat["JSON"] = "json";
})(TableFormat || (TableFormat = {}));
export var ContentCategory;
(function (ContentCategory) {
    ContentCategory["PHOTOGRAPH"] = "photograph";
    ContentCategory["DIAGRAM"] = "diagram";
    ContentCategory["CHART"] = "chart";
    ContentCategory["SCREENSHOT"] = "screenshot";
    ContentCategory["DOCUMENT"] = "document";
    ContentCategory["UNKNOWN"] = "unknown";
})(ContentCategory || (ContentCategory = {}));
export const DEFAULT_MULTIMODAL_CONFIG = {
    image: {
        maxFileSizeBytes: 10 * 1024 * 1024,
        supportedFormats: [ImageFormat.JPEG, ImageFormat.PNG, ImageFormat.WEBP],
        maxDescriptionLength: 500,
        ocrEnabled: true,
    },
    table: {
        maxRows: 1000,
        maxColumns: 50,
        supportedFormats: [
            TableFormat.HTML,
            TableFormat.MARKDOWN,
            TableFormat.CSV,
            TableFormat.JSON,
        ],
    },
    chart: {
        supportedTypes: [
            ChartType.BAR,
            ChartType.LINE,
            ChartType.PIE,
            ChartType.SCATTER,
            ChartType.AREA,
            ChartType.HISTOGRAM,
        ],
        maxDataPoints: 100,
    },
    pdf: {
        maxPages: 500,
        maxFileSizeBytes: 50 * 1024 * 1024,
        extractTables: true,
        extractImages: false,
    },
};
//# sourceMappingURL=types.js.map