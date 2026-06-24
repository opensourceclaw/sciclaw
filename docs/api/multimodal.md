# Multi-Modal Module API

## Overview

Multi-modal content processing: image analysis, table extraction (HTML/Markdown/CSV/JSON), chart parsing, and PDF analysis. Supports automatic format detection via magic bytes.

## Classes

### ImageProcessor

- **Constructor**: `new ImageProcessor(config?: Partial<MultiModalConfig["image"]>)`
  - Config: maxFileSizeBytes, supportedFormats, maxDescriptionLength, ocrEnabled
- `processImage(input: string | Buffer): Promise<ImageContent>`
  - Detects format via magic bytes (JPEG/PNG/WEBP/GIF/BMP), extracts metadata (dimensions, color space, DPI), categorizes content (photograph/diagram/chart/screenshot), extracts text (OCR simulation), dominant colors, detected objects
- `detectFormat(buffer: Buffer): ImageFormat`
- `extractMetadata(buffer: Buffer): ImageMetadata`
- `categorizeContent(metadata, description): ContentCategory`
- `getProcessorStats(): { totalProcessed; avgConfidence }`

### TableExtractor

- **Constructor**: `new TableExtractor(config?: Partial<MultiModalConfig["table"]>)`
  - Config: maxRows (default 1000), maxColumns (default 50), supportedFormats
- `extractTable(input: string): TableData`
  - Auto-detects format (HTML/Markdown/CSV/JSON); parses headers and rows; detects numeric data
- `extractFromHTML(html: string): TableData[]`
  - Parses `<table>` elements including `<caption>`, `<th>`, `<td>`, `colspan`/`rowspan`
- `extractFromMarkdown(md: string): TableData[]`
- `extractFromCSV(csv: string): TableData`
- `extractFromJSON(json: string): TableData`
- `convertTo(format: TableFormat, table: TableData): string`
  - Convert table to Markdown, CSV, or JSON strings
- `validate(table: TableData): { valid; errors }`
- `getExtractorStats(): { totalExtracted; avgConfidence }`

### ChartParser

- **Constructor**: `new ChartParser(config?: Partial<MultiModalConfig["chart"]>)`
  - Config: supportedTypes, maxDataPoints
- `parseChart(input: string | Buffer): Promise<ChartData>`
  - Detects chart type (BAR/LINE/PIE/SCATTER/AREA/HISTOGRAM) from description; extracts labels and datasets; returns UNKNOWN if no type detected
- `detectChartType(description: string): Promise<ChartType>`
- `extractLabels(description: string): Promise<string[]>`
- `extractDatasets(description: string): Promise<ChartDataset[]>`
- `parseFromDescription(description: string): Promise<ChartData>`
- `getParserStats(): { totalParsed; avgConfidence }`

### PDFAnalyzer

- **Constructor**: `new PDFAnalyzer(config?: Partial<MultiModalConfig["pdf"]>)`
  - Config: maxPages (default 500), maxFileSizeBytes (50MB), extractTables, extractImages
- `analyzePDF(input: string | Buffer): Promise<PDFContent>`
  - Validates PDF magic bytes (%PDF-), extracts metadata (title/author/subject/keywords/dates), splits into pages, extracts text and tables per page
- `extractMetadata(text: string): PDFMetadata`
- `splitIntoPages(text: string): PDFPage[]`
- `searchText(pdf: PDFContent, query: string): Array<{ page; context }>`
- `exportContent(pdf: PDFContent, format: "text" | "markdown"): string`
- `getAnalyzerStats(): { totalAnalyzed; totalPages; avgConfidence }`

### MultiModalProcessor

- **Constructor**: `new MultiModalProcessor(config?: MultiModalProcessorConfig)`
- `processImage(input): Promise<ImageContent>`
- `extractTable(input): TableData`
- `parseChart(input): Promise<ChartData>`
- `analyzePDF(input): Promise<PDFContent>`
- `processBatch(inputs): Promise<Array<ImageContent | TableData | ChartData | PDFContent>>`
- `autoProcess(input: string | Buffer): Promise<{ type; result }>`
  - Detects type via magic bytes (%PDF- for PDF, JPEG/PNG headers for image, HTML table tag, Markdown table); falls back to chart parsing, then image
- `getStats(): { images; tables; charts; pdfs }`

### Factory Functions

- `createImageProcessor(config?): ImageProcessor`
- `createTableExtractor(config?): TableExtractor`
- `createChartParser(config?): ChartParser`
- `createPDFAnalyzer(config?): PDFAnalyzer`
- `createMultiModalProcessor(config?): MultiModalProcessor`

## Usage Example

```typescript
import { createMultiModalProcessor } from "deepclaw";

const processor = createMultiModalProcessor();

// Auto-detect and process
const { type, result } = await processor.autoProcess(someBuffer);
// type: "image" | "table" | "chart" | "pdf"

// Or process specifically
const imageResult = await processor.processImage(buffer);
// imageResult.metadata, imageResult.category, imageResult.description

// Batch processing
const results = await processor.processBatch([
  { type: "image", data: imageBuffer },
  { type: "table", data: "<table>...</table>" },
  { type: "pdf", data: pdfBuffer },
]);
```
