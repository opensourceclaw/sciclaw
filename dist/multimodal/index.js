import { createImageProcessor, } from "./image.js";
import { createTableExtractor, } from "./table.js";
import { createChartParser, } from "./chart.js";
import { createPDFAnalyzer, } from "./pdf.js";
export * from "./types.js";
export * from "./image.js";
export * from "./table.js";
export * from "./chart.js";
export * from "./pdf.js";
// ── MultiModalProcessor ────────────────────────────────────────────────
export class MultiModalProcessor {
    imageProcessor;
    tableExtractor;
    chartParser;
    pdfAnalyzer;
    constructor(config) {
        this.imageProcessor = createImageProcessor(config?.image);
        this.tableExtractor = createTableExtractor(config?.table);
        this.chartParser = createChartParser(config?.chart);
        this.pdfAnalyzer = createPDFAnalyzer(config?.pdf);
    }
    async processImage(input) {
        return this.imageProcessor.processImage(input);
    }
    extractTable(input) {
        return this.tableExtractor.extractTable(input);
    }
    async parseChart(input) {
        return this.chartParser.parseChart(input);
    }
    async analyzePDF(input) {
        return this.pdfAnalyzer.analyzePDF(input);
    }
    async processBatch(inputs) {
        const results = [];
        for (const { type, data } of inputs) {
            switch (type) {
                case "image":
                    results.push(await this.imageProcessor.processImage(data));
                    break;
                case "table":
                    results.push(this.tableExtractor.extractTable(data));
                    break;
                case "chart":
                    results.push(await this.chartParser.parseChart(data));
                    break;
                case "pdf":
                    results.push(await this.pdfAnalyzer.analyzePDF(data));
                    break;
            }
        }
        return results;
    }
    async autoProcess(input) {
        const buffer = typeof input === "string" ? Buffer.from(input) : input;
        // Check PDF magic bytes
        if (buffer.length >= 5 &&
            buffer.toString("utf-8", 0, 5) === "%PDF-") {
            return {
                type: "pdf",
                result: await this.pdfAnalyzer.analyzePDF(buffer),
            };
        }
        // Check image magic bytes
        if ((buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) ||
            (buffer[0] === 0x89 &&
                buffer[1] === 0x50 &&
                buffer[2] === 0x4e &&
                buffer[3] === 0x47)) {
            return {
                type: "image",
                result: await this.imageProcessor.processImage(buffer),
            };
        }
        // Check HTML table
        const str = typeof input === "string" ? input : buffer.toString("utf-8");
        if (/<table[\s>]/i.test(str)) {
            return {
                type: "table",
                result: this.tableExtractor.extractTable(str),
            };
        }
        // Check markdown table
        if (/^\|[\s\-:]+\|/m.test(str)) {
            return {
                type: "table",
                result: this.tableExtractor.extractTable(str),
            };
        }
        // Try as chart description
        const chartResult = await this.chartParser.parseChart(str);
        if (chartResult.type !== "unknown") {
            return { type: "chart", result: chartResult };
        }
        // Default: try image
        return {
            type: "image",
            result: await this.imageProcessor.processImage(buffer),
        };
    }
    getStats() {
        const iStats = this.imageProcessor.getProcessorStats();
        const tStats = this.tableExtractor.getExtractorStats();
        const cStats = this.chartParser.getParserStats();
        const pStats = this.pdfAnalyzer.getAnalyzerStats();
        return {
            images: iStats.totalProcessed,
            tables: tStats.totalExtracted,
            charts: cStats.totalParsed,
            pdfs: pStats.totalAnalyzed,
        };
    }
    getImageProcessor() {
        return this.imageProcessor;
    }
    getTableExtractor() {
        return this.tableExtractor;
    }
    getChartParser() {
        return this.chartParser;
    }
    getPDFAnalyzer() {
        return this.pdfAnalyzer;
    }
}
export function createMultiModalProcessor(config) {
    return new MultiModalProcessor(config);
}
//# sourceMappingURL=index.js.map