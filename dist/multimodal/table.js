/**
 * SciClaw v3.0.0 — Table Extractor
 *
 * Extracts tables from HTML, Markdown, CSV, and JSON formats.
 * Supports format detection, conversion, and validation.
 */
import { TableFormat, DEFAULT_MULTIMODAL_CONFIG, } from "./types.js";
// ── Helpers ──────────────────────────────────────────────────────────────
function emptyTable(format) {
    return {
        headers: [],
        rows: [],
        sourceFormat: format,
        rowCount: 0,
        columnCount: 0,
        hasNumericData: false,
        extractionConfidence: 0,
    };
}
function hasNumericData(table) {
    const numericPattern = /^-?\d+\.?\d*[%]?$/;
    for (const row of table.rows) {
        for (const cell of row) {
            if (numericPattern.test(cell.trim()))
                return true;
        }
    }
    return false;
}
// ── HTML Parser ──────────────────────────────────────────────────────────
function parseHTMLTable(html) {
    const tables = [];
    const tableRegex = /<table[\s>][\s\S]*?<\/table>/gi;
    const matches = html.match(tableRegex);
    if (!matches)
        return tables;
    for (const tableHTML of matches) {
        const captionMatch = tableHTML.match(/<caption[^>]*>([\s\S]*?)<\/caption>/i);
        const caption = captionMatch
            ? captionMatch[1].replace(/<[^>]+>/g, "").trim()
            : undefined;
        const headerMatches = tableHTML.match(/<th[^>]*>([\s\S]*?)<\/th>/gi);
        const headers = headerMatches
            ? headerMatches.map((h) => h.replace(/<[^>]+>/g, "").trim())
            : [];
        const rowMatches = tableHTML.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi);
        const rows = [];
        for (const rowHTML of rowMatches || []) {
            if (/<th/i.test(rowHTML))
                continue;
            const cellMatches = rowHTML.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
            if (!cellMatches)
                continue;
            const cells = cellMatches.map((c) => c.replace(/<[^>]+>/g, "").trim());
            while (cells.length < headers.length)
                cells.push("");
            rows.push(cells.slice(0, headers.length || cells.length));
        }
        if (headers.length > 0 || rows.length > 0) {
            tables.push({
                headers,
                rows,
                caption,
                sourceFormat: TableFormat.HTML,
                rowCount: rows.length,
                columnCount: headers.length || (rows[0]?.length ?? 0),
                hasNumericData: false,
                extractionConfidence: 0.9,
            });
        }
    }
    return tables;
}
// ── Markdown Parser ──────────────────────────────────────────────────────
function parseMarkdownTable(markdown) {
    const tables = [];
    const lines = markdown.split("\n");
    let i = 0;
    while (i < lines.length) {
        if (/^\|[\s\-:]+\|/.test(lines[i])) {
            const headerLine = i > 0 ? (lines[i - 1] ?? "") : "";
            const headers = headerLine
                .split("|")
                .map((h) => h.trim())
                .filter((h) => h.length > 0);
            if (headers.length === 0) {
                i++;
                continue;
            }
            const rows = [];
            let j = i + 1;
            while (j < lines.length && lines[j].startsWith("|")) {
                const cells = lines[j]
                    .split("|")
                    .map((c) => c.trim())
                    .filter((c) => c.length > 0);
                if (cells.length > 0) {
                    while (cells.length < headers.length)
                        cells.push("");
                    rows.push(cells.slice(0, headers.length));
                }
                j++;
            }
            tables.push({
                headers,
                rows,
                sourceFormat: TableFormat.MARKDOWN,
                rowCount: rows.length,
                columnCount: headers.length,
                hasNumericData: false,
                extractionConfidence: 0.85,
            });
            i = j;
        }
        else {
            i++;
        }
    }
    return tables;
}
// ── CSV Parser ───────────────────────────────────────────────────────────
function parseCSVTable(csv) {
    const lines = csv.trim().split("\n");
    if (lines.length === 0)
        return emptyTable(TableFormat.CSV);
    const parseRow = (line) => {
        const cells = [];
        let current = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            }
            else if (char === "," && !inQuotes) {
                cells.push(current.trim());
                current = "";
            }
            else {
                current += char;
            }
        }
        cells.push(current.trim());
        return cells;
    };
    const headers = parseRow(lines[0]);
    const rows = lines.slice(1).map(parseRow);
    for (const row of rows) {
        while (row.length < headers.length)
            row.push("");
    }
    return {
        headers,
        rows,
        sourceFormat: TableFormat.CSV,
        rowCount: rows.length,
        columnCount: headers.length,
        hasNumericData: false,
        extractionConfidence: 0.8,
    };
}
// ── JSON Parser ──────────────────────────────────────────────────────────
function parseJSONTable(json) {
    try {
        const parsed = JSON.parse(json);
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        if (arr.length === 0)
            return emptyTable(TableFormat.JSON);
        const headers = Object.keys(arr[0]);
        const rows = arr.map((item) => headers.map((h) => String(item[h] ?? "")));
        return {
            headers,
            rows,
            sourceFormat: TableFormat.JSON,
            rowCount: rows.length,
            columnCount: headers.length,
            hasNumericData: false,
            extractionConfidence: 0.95,
        };
    }
    catch {
        throw new Error("Invalid JSON table data");
    }
}
// ── Format Detection ─────────────────────────────────────────────────────
function detectFormat(input) {
    if (/<table[\s>]/i.test(input))
        return TableFormat.HTML;
    if (/^\|[\s\-:]+\|/m.test(input))
        return TableFormat.MARKDOWN;
    try {
        JSON.parse(input);
        if (input.trim().startsWith("[") || input.trim().startsWith("{")) {
            return TableFormat.JSON;
        }
    }
    catch {
        // fall through
    }
    return TableFormat.CSV;
}
// ── TableExtractor ───────────────────────────────────────────────────────
export class TableExtractor {
    config;
    totalExtracted = 0;
    formatDist = {};
    constructor(config) {
        this.config = { ...DEFAULT_MULTIMODAL_CONFIG.table, ...config };
        if (this.config.maxRows < 1)
            this.config.maxRows = 1;
        if (this.config.maxRows > 10000)
            this.config.maxRows = 10000;
        if (this.config.maxColumns < 1)
            this.config.maxColumns = 1;
        if (this.config.maxColumns > 100)
            this.config.maxColumns = 100;
    }
    extractTable(input, format) {
        const fmt = format ?? detectFormat(input);
        let table;
        switch (fmt) {
            case TableFormat.HTML: {
                const tables = parseHTMLTable(input);
                table = tables[0] ?? emptyTable(TableFormat.HTML);
                break;
            }
            case TableFormat.MARKDOWN: {
                const tables = parseMarkdownTable(input);
                table = tables[0] ?? emptyTable(TableFormat.MARKDOWN);
                break;
            }
            case TableFormat.CSV:
                table = parseCSVTable(input);
                break;
            case TableFormat.JSON:
                table = parseJSONTable(input);
                break;
            default:
                table = emptyTable(TableFormat.HTML);
        }
        // Apply limits
        if (table.rows.length > this.config.maxRows) {
            table.rows = table.rows.slice(0, this.config.maxRows);
            table.rowCount = table.rows.length;
            table.extractionConfidence *= 0.8;
        }
        if (table.headers.length > this.config.maxColumns) {
            table.headers = table.headers.slice(0, this.config.maxColumns);
            table.rows = table.rows.map((r) => r.slice(0, this.config.maxColumns));
            table.columnCount = table.headers.length;
            table.extractionConfidence *= 0.8;
        }
        table.hasNumericData = hasNumericData(table);
        this.totalExtracted++;
        this.formatDist[fmt] = (this.formatDist[fmt] || 0) + 1;
        return table;
    }
    extractTables(input, format) {
        const fmt = format ?? detectFormat(input);
        switch (fmt) {
            case TableFormat.HTML:
                return parseHTMLTable(input);
            case TableFormat.MARKDOWN:
                return parseMarkdownTable(input);
            default:
                return [this.extractTable(input, fmt)];
        }
    }
    parseHTMLTable(html) {
        return parseHTMLTable(html);
    }
    parseMarkdownTable(markdown) {
        return parseMarkdownTable(markdown);
    }
    parseCSVTable(csv) {
        return parseCSVTable(csv);
    }
    parseJSONTable(json) {
        return parseJSONTable(json);
    }
    detectFormat(input) {
        return detectFormat(input);
    }
    hasNumericData(table) {
        return hasNumericData(table);
    }
    toMarkdown(table) {
        const lines = [];
        lines.push("| " + table.headers.join(" | ") + " |");
        lines.push("|" + table.headers.map(() => " --- ").join("|") + "|");
        for (const row of table.rows) {
            lines.push("| " + row.join(" | ") + " |");
        }
        return lines.join("\n");
    }
    toCSV(table) {
        const lines = [];
        lines.push(table.headers.join(","));
        for (const row of table.rows) {
            lines.push(row.map((c) => (c.includes(",") ? `"${c}"` : c)).join(","));
        }
        return lines.join("\n");
    }
    toJSON(table) {
        return table.rows.map((row) => {
            const obj = {};
            table.headers.forEach((h, i) => {
                obj[h] = row[i] ?? "";
            });
            return obj;
        });
    }
    validateTable(table) {
        const errors = [];
        if (table.headers.length === 0) {
            errors.push("Table must have at least one header");
        }
        if (table.rows.length === 0) {
            errors.push("Table must have at least one data row");
        }
        for (let i = 0; i < table.rows.length; i++) {
            if (table.rows[i].length !== table.headers.length) {
                errors.push(`Row ${i + 1} has ${table.rows[i].length} columns, expected ${table.headers.length}`);
            }
        }
        return { valid: errors.length === 0, errors };
    }
    getExtractorStats() {
        return {
            totalExtracted: this.totalExtracted,
            formatDistribution: { ...this.formatDist },
        };
    }
}
export function createTableExtractor(config) {
    return new TableExtractor(config);
}
//# sourceMappingURL=table.js.map