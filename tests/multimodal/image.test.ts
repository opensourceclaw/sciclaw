import { describe, it, expect } from "vitest";
import {
  ImageProcessor,
  createImageProcessor,
} from "../../src/multimodal/image.js";
import {
  ImageFormat,
  ContentCategory,
} from "../../src/multimodal/types.js";

function jpegBuf(): Buffer {
  const buf = Buffer.alloc(100);
  buf[0] = 0xff;
  buf[1] = 0xd8;
  buf[2] = 0xff;
  return buf;
}

function pngBuf(): Buffer {
  const buf = Buffer.alloc(100);
  buf[0] = 0x89;
  buf[1] = 0x50;
  buf[2] = 0x4e;
  buf[3] = 0x47;
  buf.writeUInt32BE(800, 16);
  buf.writeUInt32BE(600, 20);
  return buf;
}

function webpBuf(): Buffer {
  const buf = Buffer.alloc(100);
  buf[0] = 0x52;
  buf[1] = 0x49;
  buf[2] = 0x46;
  buf[3] = 0x46;
  buf[8] = 0x57;
  buf[9] = 0x45;
  buf[10] = 0x42;
  buf[11] = 0x50;
  return buf;
}

function gifBuf(): Buffer {
  const buf = Buffer.alloc(100);
  buf[0] = 0x47;
  buf[1] = 0x49;
  buf[2] = 0x46;
  buf[3] = 0x38;
  buf.writeUInt16LE(400, 6);
  buf.writeUInt16LE(300, 8);
  return buf;
}

function bmpBuf(): Buffer {
  const buf = Buffer.alloc(100);
  buf[0] = 0x42;
  buf[1] = 0x4d;
  return buf;
}

describe("ImageProcessor", () => {
  let processor: ImageProcessor;

  beforeEach(() => {
    processor = createImageProcessor();
  });

  describe("format detection", () => {
    it("detects JPEG format from magic bytes", () => {
      expect(processor.detectFormat(jpegBuf())).toBe(ImageFormat.JPEG);
    });

    it("detects PNG format from magic bytes", () => {
      expect(processor.detectFormat(pngBuf())).toBe(ImageFormat.PNG);
    });

    it("detects WebP format from magic bytes", () => {
      expect(processor.detectFormat(webpBuf())).toBe(ImageFormat.WEBP);
    });

    it("detects GIF format from magic bytes", () => {
      expect(processor.detectFormat(gifBuf())).toBe(ImageFormat.GIF);
    });

    it("detects BMP format from magic bytes", () => {
      expect(processor.detectFormat(bmpBuf())).toBe(ImageFormat.BMP);
    });
  });

  describe("processImage", () => {
    it("processes JPEG image", async () => {
      const result = await processor.processImage(jpegBuf());
      expect(result.metadata.format).toBe(ImageFormat.JPEG);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("processes PNG image", async () => {
      const result = await processor.processImage(pngBuf());
      expect(result.metadata.format).toBe(ImageFormat.PNG);
      expect(result.metadata.width).toBe(800);
      expect(result.metadata.height).toBe(600);
    });

    it("processes WebP image", async () => {
      const result = await processor.processImage(webpBuf());
      expect(result.metadata.format).toBe(ImageFormat.WEBP);
    });

    it("processes image from string input", async () => {
      const result = await processor.processImage("test");
      expect(result.metadata.format).toBeDefined();
    });
  });

  describe("categorization", () => {
    it("categorizes chart content", () => {
      const meta = { format: ImageFormat.PNG, width: 800, height: 600, fileSizeBytes: 1000 };
      expect(processor.categorizeContent(meta, "bar chart showing sales")).toBe(
        ContentCategory.CHART,
      );
    });

    it("categorizes document content", () => {
      const meta = { format: ImageFormat.PNG, width: 600, height: 800, fileSizeBytes: 1000 };
      expect(processor.categorizeContent(meta, "scanned document page")).toBe(
        ContentCategory.DOCUMENT,
      );
    });

    it("categorizes screenshot content", () => {
      const meta = { format: ImageFormat.PNG, width: 800, height: 600, fileSizeBytes: 1000 };
      expect(
        processor.categorizeContent(meta, "screenshot of the interface with buttons"),
      ).toBe(ContentCategory.SCREENSHOT);
    });

    it("categorizes photograph content", () => {
      const meta = { format: ImageFormat.PNG, width: 800, height: 600, fileSizeBytes: 1000 };
      expect(processor.categorizeContent(meta, "a beautiful landscape photo")).toBe(
        ContentCategory.PHOTOGRAPH,
      );
    });
  });

  describe("validation", () => {
    it("validates supported formats", () => {
      expect(processor.validateFormat("jpeg")).toBe(true);
      expect(processor.validateFormat("png")).toBe(true);
    });

    it("rejects unsupported format", () => {
      expect(processor.validateFormat("tiff")).toBe(false);
    });

    it("rejects oversized file", () => {
      const small = createImageProcessor({ maxFileSizeBytes: 1024 });
      expect(() => small.validateSize(2048)).toThrow("exceeds max size");
    });
  });

  describe("edge cases", () => {
    it("handles empty buffer", async () => {
      await expect(processor.processImage(Buffer.alloc(0))).rejects.toThrow(
        "Empty image buffer",
      );
    });
  });

  describe("stats", () => {
    it("getProcessorStats tracks counts", async () => {
      await processor.processImage(jpegBuf());
      await processor.processImage(pngBuf());
      const stats = processor.getProcessorStats();
      expect(stats.totalProcessed).toBe(2);
    });
  });
});
