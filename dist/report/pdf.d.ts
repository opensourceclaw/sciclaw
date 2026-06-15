/**
 * PDF Generator - Generate PDF reports from markdown content
 */
export interface PDFOptions {
    title?: string;
    author?: string;
    pageSize?: 'A4' | 'Letter';
    margins?: {
        top: number;
        bottom: number;
        left: number;
        right: number;
    };
}
/**
 * Generate PDF from markdown content
 */
export declare function generatePDF(markdown: string, outputPath: string, options?: PDFOptions): Promise<void>;
/**
 * Generate PDF from HTML content (simplified)
 */
export declare function generatePDFFromHTML(html: string, outputPath: string, options?: PDFOptions): Promise<void>;
export { generatePDF as default };
//# sourceMappingURL=pdf.d.ts.map