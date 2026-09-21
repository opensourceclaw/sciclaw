import { CitationStyle, type Citation } from "./types.js";
export declare class CitationFormatter {
    private defaultStyle;
    constructor(style?: CitationStyle);
    format(citation: Citation, style?: CitationStyle): string;
    formatBibliography(citations: Citation[], style?: CitationStyle): string;
    formatInText(citation: Citation, style?: CitationStyle, position?: "end" | "nar", noteNumber?: number): string;
    private formatAPA;
    private formatMLA;
    private formatChicago;
    private intextAPA;
    private intextMLA;
    private intextChicago;
    private extractYear;
    private extractLastName;
    private formatDate;
}
export declare function formatCitation(citation: Citation, style?: CitationStyle): string;
export declare function formatBibliography(citations: Citation[], style?: CitationStyle): string;
//# sourceMappingURL=citation_formatter.d.ts.map