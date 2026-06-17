import { describe, it, expect } from "vitest";
import {
  MultiModalProcessor,
  createMultiModalProcessor,
} from "../../src/multimodal/index.js";
import {
  ImageProcessor,
} from "../../src/multimodal/image.js";
import {
  TableExtractor,
} from "../../src/multimodal/table.js";
import {
  ChartParser,
} from "../../src/multimodal/chart.js";
import {
  PDFAnalyzer,
} from "../../src/multimodal/pdf.js";
import {
  ImageFormat,
  ChartType,
  TableFormat,
  ContentCategory,
} from "../../src/multimodal/types.js";

describe("MultiModalProcessor", () => {
  let processor: MultiModalProcessor;

  beforeEach(() => {
    processor = createMultiModalProcessor();
  });

  it("creates MultiModalProcessor", () => {
    expect(processor).toBeInstanceOf(MultiModalProcessor);
  });

  describe("delegation", () => {
    it("processImage delegates to ImageProcessor", async () => {
      const buf = Buffer.alloc(100);
      buf[0] = 0xff;
      buf[1] = 0xd8;
      buf[2] = 0xff;
      const result = await processor.processImage(buf);
      expect(result.metadata.format).toBe(ImageFormat.JPEG);
    });

    it("extractTable delegates to TableExtractor", () => {
      const result = processor.extractTable(
        "Name,Age\nAlice,30\nBob,25",
      );
      expect(result.headers).toEqual(["Name", "Age"]);
      expect(result.rows).toHaveLength(2);
    });

    it("parseChart delegates to ChartParser", async () => {
      const result = await processor.parseChart("bar chart showing data");
      expect(result.type).toBe(ChartType.BAR);
    });

    it("analyzePDF delegates to PDFAnalyzer", async () => {
      const content = "%PDF-1.4\n/Type /Page\n/Type /Page\nSome text here.\n\fMore text.";
      const result = await processor.analyzePDF(Buffer.from(content));
      expect(result.totalPages).toBe(2);
    });
  });

  describe("autoProcess", () => {
    it("autoProcess detects PDF", async () => {
      const content = "%PDF-1.4\n/Type /Page\nSome text.\n\fMore.";
      const result = await processor.autoProcess(Buffer.from(content));
      expect(result.type).toBe("pdf");
    });

    it("autoProcess detects JPEG image", async () => {
      const buf = Buffer.alloc(100);
      buf[0] = 0xff;
      buf[1] = 0xd8;
      buf[2] = 0xff;
      const result = await processor.autoProcess(buf);
      expect(result.type).toBe("image");
    });

    it("autoProcess detects PNG image", async () => {
      const buf = Buffer.alloc(100);
      buf[0] = 0x89;
      buf[1] = 0x50;
      buf[2] = 0x4e;
      buf[3] = 0x47;
      const result = await processor.autoProcess(buf);
      expect(result.type).toBe("image");
    });

    it("autoProcess detects HTML table", async () => {
      const result = await processor.autoProcess(
        "<table><tr><th>A</th></tr><tr><td>1</td></tr></table>",
      );
      expect(result.type).toBe("table");
    });

    it("autoProcess detects Markdown table", async () => {
      const result = await processor.autoProcess(
        "| A | B |\n| --- | --- |\n| 1 | 2 |",
      );
      expect(result.type).toBe("table");
    });

    it("autoProcess detects chart", async () => {
      const result = await processor.autoProcess(
        "bar chart showing sales data",
      );
      expect(result.type).toBe("chart");
    });

    it("autoProcess falls back to image for unknown input", async () => {
      const result = await processor.autoProcess("some random text");
      expect(result.type).toBe("image");
    });
  });

  describe("processBatch", () => {
    it("processes batch of mixed inputs", async () => {
      const results = await processor.processBatch([
        {
          type: "table",
          data: "Name,Age\nAlice,30",
        },
        {
          type: "chart",
          data: "bar chart showing data",
        },
      ]);
      expect(results).toHaveLength(2);
    });
  });

  describe("getStats", () => {
    it("tracks stats across processors", async () => {
      await processor.processImage(
        Buffer.from(
          "\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x03\x20\x00\x00\x02\x58",
        ),
      );
      processor.extractTable("Name,Age\nAlice,30");
      const stats = processor.getStats();
      expect(stats.images).toBeGreaterThanOrEqual(1);
      expect(stats.tables).toBeGreaterThanOrEqual(1);
    });
  });

  describe("getters", () => {
    it("getImageProcessor returns image processor", () => {
      expect(processor.getImageProcessor()).toBeInstanceOf(ImageProcessor);
    });

    it("getTableExtractor returns table extractor", () => {
      expect(processor.getTableExtractor()).toBeInstanceOf(TableExtractor);
    });

    it("getChartParser returns chart parser", () => {
      expect(processor.getChartParser()).toBeInstanceOf(ChartParser);
    });

    it("getPDFAnalyzer returns pdf analyzer", () => {
      expect(processor.getPDFAnalyzer()).toBeInstanceOf(PDFAnalyzer);
    });
  });

  describe("barrel exports", () => {
    it("exports ImageFormat enum", () => {
      expect(ImageFormat.JPEG).toBe("jpeg");
    });

    it("exports ChartType enum", () => {
      expect(ChartType.BAR).toBe("bar");
    });

    it("exports TableFormat enum", () => {
      expect(TableFormat.HTML).toBe("html");
    });

    it("exports ContentCategory enum", () => {
      expect(ContentCategory.PHOTOGRAPH).toBe("photograph");
    });

    it("exports ImageProcessor class", () => {
      expect(ImageProcessor).toBeDefined();
    });

    it("exports TableExtractor class", () => {
      expect(TableExtractor).toBeDefined();
    });

    it("exports ChartParser class", () => {
      expect(ChartParser).toBeDefined();
    });

    it("exports PDFAnalyzer class", () => {
      expect(PDFAnalyzer).toBeDefined();
    });

    it("exports MultiModalProcessor class", () => {
      expect(MultiModalProcessor).toBeDefined();
    });
  });

  describe("factory", () => {
    it("createMultiModalProcessor creates processor", () => {
      const p = createMultiModalProcessor();
      expect(p).toBeInstanceOf(MultiModalProcessor);
    });
  });
});
