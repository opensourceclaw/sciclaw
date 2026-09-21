import { CitationStyle, type Citation } from "./types.js";

export class CitationFormatter {
  private defaultStyle: CitationStyle;

  constructor(style: CitationStyle = CitationStyle.APA) {
    this.defaultStyle = style;
  }

  format(citation: Citation, style?: CitationStyle): string {
    const s = style ?? this.defaultStyle;
    const handlers: Record<CitationStyle, (c: Citation) => string> = {
      [CitationStyle.APA]: this.formatAPA,
      [CitationStyle.MLA]: this.formatMLA,
      [CitationStyle.CHICAGO]: this.formatChicago,
    };
    return handlers[s](citation);
  }

  formatBibliography(citations: Citation[], style?: CitationStyle): string {
    const s = style ?? this.defaultStyle;
    const titles: Record<CitationStyle, string> = {
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

  formatInText(citation: Citation, style?: CitationStyle, position: "end" | "nar" = "end", noteNumber = 1): string {
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

  private formatAPA = (c: Citation): string => {
    const author = c.author ?? "Unknown";
    const year = this.extractYear(c.publishedDate);
    const title = c.title || "Untitled";
    const parts = [`${author} (${year}). ${title}.`];
    if (c.siteName) parts.push(` ${c.siteName}.`);
    parts.push(` ${c.url}`);
    return parts.join("");
  };

  private formatMLA = (c: Citation): string => {
    const author = c.author ?? "Unknown";
    const title = c.title || "Untitled";
    const site = c.siteName ?? "Web";
    const date = c.publishedDate ? this.formatDate(c.publishedDate) : "n.d.";
    return `${author}. "${title}." ${site}, ${date}. ${c.url}.`;
  };

  private formatChicago = (c: Citation): string => {
    const author = c.author ?? "Unknown";
    const title = c.title || "Untitled";
    const site = c.siteName ?? "Web";
    const date = c.publishedDate ? this.formatDate(c.publishedDate) : "n.d.";
    return `${author}. "${title}." ${site}. Last modified ${date}. ${c.url}.`;
  };

  private intextAPA = (c: Citation, pos: "end" | "nar"): string => {
    const author = this.extractLastName(c.author) ?? "Unknown";
    const year = this.extractYear(c.publishedDate);
    return pos === "nar" ? `${author} (${year})` : `(${author}, ${year})`;
  };

  private intextMLA = (c: Citation, pos: "end" | "nar"): string => {
    const author = this.extractLastName(c.author) ?? "Unknown";
    return pos === "nar" ? author : `(${author})`;
  };

  private intextChicago = (c: Citation, pos: "end" | "nar", noteNumber: number): string => {
    const author = c.author ?? "Unknown";
    return pos === "nar" ? author : `Note ${noteNumber}.`;
  };

  private extractYear(date?: Date): string {
    if (!date) return "n.d.";
    return date.getFullYear().toString();
  }

  private extractLastName(author?: string): string | undefined {
    if (!author) return undefined;
    if (author.includes(",")) return author.split(",")[0]!.trim();
    const parts = author.split(/\s+/);
    return parts.length > 1 ? parts[parts.length - 1] : parts[0];
  }

  private formatDate(date: Date): string {
    const months = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }
}

export function formatCitation(citation: Citation, style?: CitationStyle): string {
  const formatter = new CitationFormatter(style ?? CitationStyle.APA);
  return formatter.format(citation);
}

export function formatBibliography(citations: Citation[], style?: CitationStyle): string {
  const formatter = new CitationFormatter(style ?? CitationStyle.APA);
  return formatter.formatBibliography(citations);
}
