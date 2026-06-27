/**
 * DeepClaw v3.0.0 — Multi-Modal Processor
 *
 * Unified processor coordinating image, table, chart, and PDF analysis.
 */
import { ContentCategory } from "./types.js";
import type {
  ImageContent,
  TableData,
  ChartData,
  PDFContent,
  MultiModalConfig,
} from "./types.js";
import {
  ImageProcessor,
  createImageProcessor,
} from "./image.js";
import {
  TableExtractor,
  createTableExtractor,
} from "./table.js";
import {
  ChartParser,
  createChartParser,
} from "./chart.js";
import {
  PDFAnalyzer,
  createPDFAnalyzer,
} from "./pdf.js";

export * from "./types.js";
export * from "./image.js";
export * from "./table.js";
export * from "./chart.js";
export * from "./pdf.js";
export * from "./gemini-vision.js";
export * from "./synthesizer.js";

// ── Config ─────────────────────────────────────────────────────────────

export interface MultiModalProcessorConfig {
  image?: Partial<MultiModalConfig["image"]>;
  table?: Partial<MultiModalConfig["table"]>;
  chart?: Partial<MultiModalConfig["chart"]>;
  pdf?: Partial<MultiModalConfig["pdf"]>;
}

// ── MultiModalProcessor ────────────────────────────────────────────────

export class MultiModalProcessor {
  private imageProcessor: ImageProcessor;
  private tableExtractor: TableExtractor;
  private chartParser: ChartParser;
  private pdfAnalyzer: PDFAnalyzer;

  constructor(config?: MultiModalProcessorConfig) {
    this.imageProcessor = createImageProcessor(config?.image);
    this.tableExtractor = createTableExtractor(config?.table);
    this.chartParser = createChartParser(config?.chart);
    this.pdfAnalyzer = createPDFAnalyzer(config?.pdf);
  }

  async processImage(input: string | Buffer): Promise<ImageContent> {
    return this.imageProcessor.processImage(input);
  }

  extractTable(input: string): TableData {
    return this.tableExtractor.extractTable(input);
  }

  async parseChart(input: string | Buffer): Promise<ChartData> {
    return this.chartParser.parseChart(input);
  }

  async analyzePDF(input: string | Buffer): Promise<PDFContent> {
    return this.pdfAnalyzer.analyzePDF(input);
  }

  async processBatch(
    inputs: Array<{
      type: "image" | "table" | "chart" | "pdf";
      data: string | Buffer;
    }>,
  ): Promise<Array<ImageContent | TableData | ChartData | PDFContent>> {
    const results: Array<
      ImageContent | TableData | ChartData | PDFContent
    > = [];
    for (const { type, data } of inputs) {
      switch (type) {
        case "image":
          results.push(await this.imageProcessor.processImage(data));
          break;
        case "table":
          results.push(
            this.tableExtractor.extractTable(data as string),
          );
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

  async autoProcess(
    input: string | Buffer,
  ): Promise<{
    type: "image" | "table" | "chart" | "pdf";
    result: ImageContent | TableData | ChartData | PDFContent;
  }> {
    const buffer =
      typeof input === "string" ? Buffer.from(input) : input;

    // Check PDF magic bytes
    if (
      buffer.length >= 5 &&
      buffer.toString("utf-8", 0, 5) === "%PDF-"
    ) {
      return {
        type: "pdf",
        result: await this.pdfAnalyzer.analyzePDF(buffer),
      };
    }

    // Check image magic bytes
    if (
      (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) ||
      (buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47)
    ) {
      return {
        type: "image",
        result: await this.imageProcessor.processImage(buffer),
      };
    }

    // Check HTML table
    const str =
      typeof input === "string" ? input : buffer.toString("utf-8");
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

  getStats(): {
    images: number;
    tables: number;
    charts: number;
    pdfs: number;
  } {
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

  getImageProcessor(): ImageProcessor {
    return this.imageProcessor;
  }

  getTableExtractor(): TableExtractor {
    return this.tableExtractor;
  }

  getChartParser(): ChartParser {
    return this.chartParser;
  }

  getPDFAnalyzer(): PDFAnalyzer {
    return this.pdfAnalyzer;
  }
}

export function createMultiModalProcessor(
  config?: MultiModalProcessorConfig,
): MultiModalProcessor {
  return new MultiModalProcessor(config);
}
