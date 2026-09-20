/**
 * SciClaw v3.0.0 — Table Extractor
 *
 * Extracts tables from HTML, Markdown, CSV, and JSON formats.
 * Supports format detection, conversion, and validation.
 */
import { TableFormat } from "./types.js";
import type { TableData, MultiModalConfig } from "./types.js";
export declare class TableExtractor {
    private config;
    private totalExtracted;
    private formatDist;
    constructor(config?: Partial<MultiModalConfig["table"]>);
    extractTable(input: string, format?: TableFormat): TableData;
    extractTables(input: string, format?: TableFormat): TableData[];
    parseHTMLTable(html: string): TableData[];
    parseMarkdownTable(markdown: string): TableData[];
    parseCSVTable(csv: string): TableData;
    parseJSONTable(json: string): TableData;
    detectFormat(input: string): TableFormat;
    hasNumericData(table: TableData): boolean;
    toMarkdown(table: TableData): string;
    toCSV(table: TableData): string;
    toJSON(table: TableData): Record<string, string>[];
    validateTable(table: TableData): {
        valid: boolean;
        errors: string[];
    };
    getExtractorStats(): {
        totalExtracted: number;
        formatDistribution: Record<string, number>;
    };
}
export declare function createTableExtractor(config?: Partial<MultiModalConfig["table"]>): TableExtractor;
//# sourceMappingURL=table.d.ts.map