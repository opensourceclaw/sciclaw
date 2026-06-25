import type { PDFContent, PDFMetadata, TableData, MultiModalConfig } from "./types.js";
export declare class PDFAnalyzer {
    private config;
    private totalAnalyzed;
    private totalPages;
    constructor(config?: Partial<MultiModalConfig["pdf"]>);
    analyzePDF(input: string | Buffer): Promise<PDFContent>;
    analyzePDFBatch(inputs: Array<string | Buffer>): Promise<PDFContent[]>;
    extractPageText(input: string | Buffer, pageNumber: number): Promise<string>;
    extractPageTables(_input: string | Buffer, _pageNumber: number): Promise<TableData[]>;
    extractMetadata(input: string | Buffer): Promise<PDFMetadata>;
    searchText(pdfContent: PDFContent, query: string): Array<{
        page: number;
        context: string;
    }>;
    exportText(pdfContent: PDFContent): string;
    exportPageText(pdfContent: PDFContent, pageNumber: number): string;
    validatePDF(input: string | Buffer): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    getAnalyzerStats(): {
        totalAnalyzed: number;
        totalPages: number;
        avgPagesPerDoc: number;
    };
}
export declare function createPDFAnalyzer(config?: Partial<MultiModalConfig["pdf"]>): PDFAnalyzer;
//# sourceMappingURL=pdf.d.ts.map