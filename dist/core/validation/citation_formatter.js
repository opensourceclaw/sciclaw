import { CitationStyle } from "./types.js";
export class CitationFormatter {
    defaultStyle;
    constructor(style = CitationStyle.APA) {
        this.defaultStyle = style;
    }
    format(citation, style) {
        const s = style ?? this.defaultStyle;
        const handlers = {
            [CitationStyle.APA]: this.formatAPA,
            [CitationStyle.MLA]: this.formatMLA,
            [CitationStyle.CHICAGO]: this.formatChicago,
        };
        return handlers[s](citation);
    }
    formatBibliography(citations, style) {
        const s = style ?? this.defaultStyle;
        const titles = {
            [CitationStyle.APA]: "References",
            [CitationStyle.MLA]: "Works Cited",
            [CitationStyle.CHICAGO]: "Bibliography",
        };
        const lines = [`## ${titles[s]}`, ""];
        citations.forEach((c, i) => {
            lines.push(`${i + 1}. ${this.format(c, s)}`);
        });
        return lines.join("\n");
    }
    formatInText(citation, style, position = "end", noteNumber = 1) {
        const s = style ?? this.defaultStyle;
        switch (s) {
            case CitationStyle.APA:
                return this.intextAPA(citation, position);
            case CitationStyle.MLA:
                return this.intextMLA(citation, position);
            case CitationStyle.CHICAGO:
                return this.intextChicago(citation, position, noteNumber);
        }
    }
    formatAPA = (c) => {
        const author = c.author ?? "Unknown";
        const year = this.extractYear(c.publishedDate);
        const title = c.title || "Untitled";
        const parts = [`${author} (${year}). ${title}.`];
        if (c.siteName)
            parts.push(` ${c.siteName}.`);
        parts.push(` ${c.url}`);
        return parts.join("");
    };
    formatMLA = (c) => {
        const author = c.author ?? "Unknown";
        const title = c.title || "Untitled";
        const site = c.siteName ?? "Web";
        const date = c.publishedDate ? this.formatDate(c.publishedDate) : "n.d.";
        return `${author}. "${title}." ${site}, ${date}. ${c.url}.`;
    };
    formatChicago = (c) => {
        const author = c.author ?? "Unknown";
        const title = c.title || "Untitled";
        const site = c.siteName ?? "Web";
        const date = c.publishedDate ? this.formatDate(c.publishedDate) : "n.d.";
        return `${author}. "${title}." ${site}. Last modified ${date}. ${c.url}.`;
    };
    intextAPA = (c, pos) => {
        const author = this.extractLastName(c.author) ?? "Unknown";
        const year = this.extractYear(c.publishedDate);
        return pos === "nar" ? `${author} (${year})` : `(${author}, ${year})`;
    };
    intextMLA = (c, pos) => {
        const author = this.extractLastName(c.author) ?? "Unknown";
        return pos === "nar" ? author : `(${author})`;
    };
    intextChicago = (c, pos, noteNumber) => {
        const author = c.author ?? "Unknown";
        return pos === "nar" ? author : `Note ${noteNumber}.`;
    };
    extractYear(date) {
        if (!date)
            return "n.d.";
        return date.getFullYear().toString();
    }
    extractLastName(author) {
        if (!author)
            return undefined;
        if (author.includes(","))
            return author.split(",")[0].trim();
        const parts = author.split(/\s+/);
        return parts.length > 1 ? parts[parts.length - 1] : parts[0];
    }
    formatDate(date) {
        const months = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."];
        return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    }
}
export function formatCitation(citation, style) {
    const formatter = new CitationFormatter(style ?? CitationStyle.APA);
    return formatter.format(citation);
}
export function formatBibliography(citations, style) {
    const formatter = new CitationFormatter(style ?? CitationStyle.APA);
    return formatter.formatBibliography(citations);
}
//# sourceMappingURL=citation_formatter.js.map