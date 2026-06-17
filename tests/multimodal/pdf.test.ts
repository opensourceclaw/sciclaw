import { describe, it, expect } from "vitest";
import {
  PDFAnalyzer,
  createPDFAnalyzer,
} from "../../src/multimodal/pdf.js";

const pdfHeader = "%PDF-1.4";
const pdfContent = `${pdfHeader}
/Title (Sample Document)
/Author (John Doe)
/Subject (Testing)
/Keywords (test, pdf, sample)
/Creator (Writer)
/Producer (LibreOffice)
/Type /Page
/Type /Page
/Type /Page
This is page 1 content.
It has multiple lines of text.
\f
This is page 2 content.
With more text on the second page.
\f
This is page 3 content.
The third page has content too.`;

describe("PDFAnalyzer", () => {
  let analyzer: PDFAnalyzer;

  beforeEach(() => {
    analyzer = createPDFAnalyzer();
  });

  describe("validation", () => {
    it("validates PDF by magic bytes", async () => {
      const result = await analyzer.validatePDF(
        Buffer.from(pdfContent),
      );
      expect(result.valid).toBe(true);
    });

    it("rejects non-PDF file", async () => {
      const result = await analyzer.validatePDF(
        Buffer.from("not a pdf file"),
      );
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("valid PDF"))).toBe(true);
    });
  });

  describe("extraction", () => {
    it("extracts text from PDF", async () => {
      const pdf = await analyzer.analyzePDF(Buffer.from(pdfContent));
      expect(pdf.totalPages).toBe(3);
      expect(pdf.pages[0]!.text).toContain("page 1 content");
    });

    it("extracts metadata from PDF", async () => {
      const pdf = await analyzer.analyzePDF(Buffer.from(pdfContent));
      expect(pdf.metadata.title).toBe("Sample Document");
      expect(pdf.metadata.author).toBe("John Doe");
    });

    it("extracts page count", async () => {
      const pdf = await analyzer.analyzePDF(Buffer.from(pdfContent));
      expect(pdf.metadata.pageCount).toBe(3);
    });
  });

  describe("search", () => {
    it("searches text in PDF", () => {
      const pdf = {
        totalPages: 2,
        pages: [
          {
            pageNumber: 1,
            text: "The quick brown fox jumps over the lazy dog",
            tables: [],
            images: [],
            wordCount: 9,
          },
          {
            pageNumber: 2,
            text: "Another page with fox mention",
            tables: [],
            images: [],
            wordCount: 5,
          },
        ],
        metadata: { pageCount: 2 },
        extractionConfidence: 0.9,
      };
      const results = analyzer.searchText(pdf, "fox");
      expect(results).toHaveLength(2);
    });

    it("returns multiple search results", () => {
      const pdf = {
        totalPages: 1,
        pages: [
          {
            pageNumber: 1,
            text: "Error found. Another error found later.",
            tables: [],
            images: [],
            wordCount: 7,
          },
        ],
        metadata: { pageCount: 1 },
        extractionConfidence: 0.9,
      };
      const results = analyzer.searchText(pdf, "error");
      expect(results).toHaveLength(2);
    });
  });

  describe("export", () => {
    it("exports full text", () => {
      const pdf = {
        totalPages: 2,
        pages: [
          {
            pageNumber: 1,
            text: "Page one content",
            tables: [],
            images: [],
            wordCount: 3,
          },
          {
            pageNumber: 2,
            text: "Page two content",
            tables: [],
            images: [],
            wordCount: 3,
          },
        ],
        metadata: { pageCount: 2 },
        extractionConfidence: 0.9,
      };
      const text = analyzer.exportText(pdf);
      expect(text).toContain("Page one content");
      expect(text).toContain("Page two content");
    });

    it("exports single page text", () => {
      const pdf = {
        totalPages: 2,
        pages: [
          {
            pageNumber: 1,
            text: "First page",
            tables: [],
            images: [],
            wordCount: 2,
          },
          {
            pageNumber: 2,
            text: "Second page",
            tables: [],
            images: [],
            wordCount: 2,
          },
        ],
        metadata: { pageCount: 2 },
        extractionConfidence: 0.9,
      };
      expect(analyzer.exportPageText(pdf, 1)).toBe("First page");
      expect(analyzer.exportPageText(pdf, 2)).toBe("Second page");
      expect(analyzer.exportPageText(pdf, 3)).toBe("");
    });
  });

  describe("edge cases", () => {
    it("handles empty PDF", async () => {
      const pdf = await analyzer.analyzePDF(
        Buffer.from("%PDF-1.4\n"),
      );
      expect(pdf.totalPages).toBeGreaterThanOrEqual(0);
    });

    it("handles PDF exceeding max size", async () => {
      const small = createPDFAnalyzer({ maxFileSizeBytes: 1024 });
      const bigBuf = Buffer.alloc(2048, "x");
      await expect(
        small.analyzePDF(bigBuf),
      ).rejects.toThrow("exceeds max size");
    });
  });

  describe("stats", () => {
    it("getAnalyzerStats tracks correctly", async () => {
      await analyzer.analyzePDF(Buffer.from(pdfContent));
      const stats = analyzer.getAnalyzerStats();
      expect(stats.totalAnalyzed).toBe(1);
      expect(stats.totalPages).toBe(3);
    });
  });
});
