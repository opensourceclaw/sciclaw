/**
 * Report generator - Generate reports in various formats
 */
import type { Report, ReportOptions } from '@deepclaw/core';
export interface ReportResult extends Report {
    pdfPath?: string;
}
export declare function generateReport(researchId: string | undefined, options: ReportOptions): Promise<ReportResult>;
export declare function generatePDFReport(researchId: string | undefined, outputPath: string): Promise<{
    id: string;
    path: string;
}>;
export { generateReport as default };
//# sourceMappingURL=index.d.ts.map