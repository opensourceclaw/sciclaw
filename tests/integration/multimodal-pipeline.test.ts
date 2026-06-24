import { describe, it, expect } from "vitest";
import { createMultiModalProcessor } from "../../src/multimodal/index.js";

describe("Multi-Modal Pipeline Integration", () => {
  it("should auto-detect and process image data", async () => {
    const processor = createMultiModalProcessor();

    // Minimal valid PNG: 1x1 pixel
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);

    const { type, result } = await processor.autoProcess(pngHeader);

    expect(type).toBe("image");
    expect(result).toBeDefined();
    if ("metadata" in result) {
      expect(result.metadata.format).toBe("png");
    }
  });

  it("should auto-detect and parse HTML table", async () => {
    const processor = createMultiModalProcessor();

    const htmlTable = `
      <table>
        <caption>Test Results</caption>
        <tr><th>Name</th><th>Score</th></tr>
        <tr><td>Alice</td><td>95</td></tr>
        <tr><td>Bob</td><td>87</td></tr>
      </table>
    `;

    const { type, result } = await processor.autoProcess(htmlTable);

    expect(type).toBe("table");
    if ("headers" in result) {
      expect(result.headers.length).toBe(2);
      expect(result.rowCount).toBe(2);
      expect(result.hasNumericData).toBe(true);
    }
  });

  it("should auto-detect markdown table", async () => {
    const processor = createMultiModalProcessor();

    const mdTable = `
| Product | Revenue | Growth |
|---------|---------|--------|
| A       | 100     | 10%    |
| B       | 200     | 20%    |
    `;

    const { type, result } = await processor.autoProcess(mdTable);

    expect(type).toBe("table");
    if ("headers" in result) {
      expect(result.headers).toContain("Product");
      expect(result.sourceFormat).toBe("markdown");
    }
  });

  it("should auto-detect PDF header", async () => {
    const processor = createMultiModalProcessor();

    const pdfHeader = Buffer.from("%PDF-1.4 test content");

    const { type, result } = await processor.autoProcess(pdfHeader);

    expect(type).toBe("pdf");
    if ("totalPages" in result) {
      expect(result.totalPages).toBeGreaterThanOrEqual(1);
    }
  });

  it("should process batch with mixed content types", async () => {
    const processor = createMultiModalProcessor();

    const results = await processor.processBatch([
      {
        type: "table" as const,
        data: "<table><tr><th>Col1</th></tr><tr><td>Val1</td></tr></table>",
      },
      {
        type: "table" as const,
        data: "| A | B |\n|---|---|\n| 1 | 2 |",
      },
    ]);

    expect(results.length).toBe(2);
    for (const result of results) {
      if ("headers" in result) {
        expect(result.headers.length).toBeGreaterThan(0);
      }
    }
  });

  it("should handle edge case: unknown content auto-detection", async () => {
    const processor = createMultiModalProcessor();

    // Plain text with chart description
    const { type, result } = await processor.autoProcess(
      "This is a bar chart showing quarterly sales data",
    );

    expect(type).toBe("chart");
    if ("type" in result) {
      expect(["bar", "unknown"]).toContain(result.type);
    }
  });

  it("should handle edge case: empty input", async () => {
    const processor = createMultiModalProcessor();

    const buffer = Buffer.from("");

    await expect(processor.autoProcess(buffer)).rejects.toThrow();
  });

  it("should get comprehensive stats after processing", async () => {
    const processor = createMultiModalProcessor();

    await processor.processImage(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

    const table = processor.extractTable("| X | Y |\n|---|---|\n| 1 | 2 |");

    const stats = processor.getStats();
    expect(stats.images).toBeGreaterThanOrEqual(1);
    expect(stats.tables).toBeGreaterThanOrEqual(1);
  });
});
