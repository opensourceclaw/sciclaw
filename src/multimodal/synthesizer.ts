/**
 * SciClaw v3.3.0 — Multi-Modal Synthesizer
 *
 * Synthesizes analysis across text, images, PDFs, tables, and charts
 * into a unified multi-modal report with cross-modal linking and conflict resolution.
 */
import type {
  ImageContent,
  TableData,
  ChartData,
  PDFContent,
} from "./types.js";
import type { ImageAnalysis } from "./gemini-vision.js";

// ── Types ────────────────────────────────────────────────────────────

export type InputType = "image" | "pdf" | "table" | "chart" | "text";

export interface MultiModalInput {
  type: InputType;
  data: Buffer | string;
  metadata?: Record<string, unknown>;
}

export interface ExtractedContent {
  type: InputType;
  text: string;
  structured?: Record<string, unknown>;
  confidence: number;
}

export interface ModalResult {
  id: string;
  inputType: InputType;
  extracted: ExtractedContent;
  source: string;
  confidence: number;
}

export type LinkRelation = "supports" | "contradicts" | "extends" | "illustrates";

export interface CrossModalLink {
  id: string;
  source: ModalResult;
  target: ModalResult;
  relation: LinkRelation;
  confidence: number;
  explanation: string;
}

export interface ReportSection {
  title: string;
  content: string;
  sourceResults: string[]; // result IDs
  confidence: number;
}

export interface MultiModalReport {
  summary: string;
  sections: ReportSection[];
  links: CrossModalLink[];
  unresolvedConflicts: CrossModalLink[];
  overallConfidence: number;
}

// ── Synthesizer Config ───────────────────────────────────────────────

export interface SynthesizerConfig {
  minLinkConfidence: number;
  maxSections: number;
  summaryMaxLength: number;
}

const DEFAULT_CONFIG: SynthesizerConfig = {
  minLinkConfidence: 0.3,
  maxSections: 10,
  summaryMaxLength: 2000,
};

// ── Helpers ──────────────────────────────────────────────────────────

function jaccardSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
  const wordsB = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
  if (wordsA.size === 0 && wordsB.size === 0) return 0;
  const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);
  return intersection.size / union.size;
}

function extractKeywords(text: string, count = 5): string[] {
  const words = text.toLowerCase().split(/\W+/).filter(
    (w) => w.length > 3 && !["this", "that", "with", "from", "have", "been", "were"].includes(w),
  );
  const freq = new Map<string, number>();
  for (const w of words) {
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([w]) => w);
}

// ── Synthesizer ──────────────────────────────────────────────────────

export class MultiModalSynthesizer {
  private config: SynthesizerConfig;

  constructor(config?: Partial<SynthesizerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Synthesize multiple modal results into a unified report.
   *
   * Pipeline:
   *   1. Normalize all inputs into ModalResults
   *   2. Link related results across modalities
   *   3. Resolve contradictions
   *   4. Generate report sections
   *   5. Assemble final report
   */
  synthesize(results: ModalResult[]): MultiModalReport {
    if (results.length === 0) {
      return {
        summary: "No multi-modal content to synthesize.",
        sections: [],
        links: [],
        unresolvedConflicts: [],
        overallConfidence: 0,
      };
    }

    // Step 1: Normalize (already done — results are pre-processed)
    // Step 2: Cross-modal linking
    const links = this.linkCrossModal(results);

    // Step 3: Resolve conflicts
    const { resolved, unresolved } = this.resolveConflicts(links);

    // Step 4: Generate sections
    const sections = this.generateSections(results, resolved);

    // Step 5: Assemble report
    const summary = this.generateSummary(sections, results);
    const overallConfidence = this.computeOverallConfidence(results, links);

    return {
      summary,
      sections,
      links: resolved,
      unresolvedConflicts: unresolved,
      overallConfidence,
    };
  }

  /** Link related results across modalities using text similarity. */
  linkCrossModal(results: ModalResult[]): CrossModalLink[] {
    const links: CrossModalLink[] = [];

    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        const a = results[i]!;
        const b = results[j]!;

        // Skip same-type comparisons (handled within that modality)
        if (a.inputType === b.inputType) continue;

        const similarity = jaccardSimilarity(
          a.extracted.text,
          b.extracted.text,
        );

        if (similarity < this.config.minLinkConfidence) continue;

        const relation = this.determineRelation(a, b, similarity);

        links.push({
          id: crypto.randomUUID(),
          source: a,
          target: b,
          relation,
          confidence: similarity,
          explanation: this.buildLinkExplanation(a, b, relation),
        });
      }
    }

    return links.sort((a, b) => b.confidence - a.confidence);
  }

  /** Resolve contradictory links. */
  resolveConflicts(links: CrossModalLink[]): {
    resolved: CrossModalLink[];
    unresolved: CrossModalLink[];
  } {
    const resolved: CrossModalLink[] = [];
    const unresolved: CrossModalLink[] = [];

    for (const link of links) {
      if (link.relation === "contradicts") {
        // If one result has significantly higher confidence, resolve
        if (
          link.source.confidence > link.target.confidence + 0.2
        ) {
          resolved.push({ ...link, relation: "supports" });
        } else if (
          link.target.confidence > link.source.confidence + 0.2
        ) {
          resolved.push({
            ...link,
            source: link.target,
            target: link.source,
            relation: "supports",
          });
        } else {
          unresolved.push(link);
        }
      } else {
        resolved.push(link);
      }
    }

    return { resolved, unresolved };
  }

  /** Generate report sections grouped by topic/theme. */
  private generateSections(
    results: ModalResult[],
    links: CrossModalLink[],
  ): ReportSection[] {
    const sections: ReportSection[] = [];

    // Group results by input type
    const byType = new Map<InputType, ModalResult[]>();
    for (const r of results) {
      const group = byType.get(r.inputType) ?? [];
      group.push(r);
      byType.set(r.inputType, group);
    }

    // Section per modality type
    for (const [type, group] of byType) {
      const typeLabel: Record<InputType, string> = {
        image: "Image Analysis",
        pdf: "Document Analysis",
        table: "Tabular Data",
        chart: "Chart Analysis",
        text: "Text Analysis",
      };

      const content = group
        .map((r) => r.extracted.text.slice(0, 500))
        .join("\n\n");
      const avgConfidence =
        group.reduce((sum, r) => sum + r.confidence, 0) / group.length;

      sections.push({
        title: typeLabel[type] ?? type,
        content,
        sourceResults: group.map((r) => r.id),
        confidence: Math.round(avgConfidence * 100) / 100,
      });
    }

    // Cross-modal synthesis section (if links exist)
    if (links.length > 0) {
      const synthesis = links
        .slice(0, 5)
        .map((l) => `- ${l.source.inputType} → ${l.target.inputType}: ${l.explanation}`)
        .join("\n");

      sections.push({
        title: "Cross-Modal Synthesis",
        content: synthesis,
        sourceResults: [],
        confidence: Math.round(
          links.reduce((sum, l) => sum + l.confidence, 0) /
            links.length *
            100,
        ) / 100,
      });
    }

    return sections.slice(0, this.config.maxSections);
  }

  /** Generate an executive summary. */
  private generateSummary(
    sections: ReportSection[],
    results: ModalResult[],
  ): string {
    const typeCounts = new Map<InputType, number>();
    for (const r of results) {
      typeCounts.set(r.inputType, (typeCounts.get(r.inputType) ?? 0) + 1);
    }

    const typeSummary = [...typeCounts.entries()]
      .map(([type, count]) => `${count} ${type}(s)`)
      .join(", ");

    const avgConf = this.computeOverallConfidence(results, []);
    const confLabel =
      avgConf >= 0.8 ? "high" : avgConf >= 0.6 ? "moderate" : "low";

    return (
      `Multi-modal synthesis report analyzing ${typeSummary}. ` +
      `Overall confidence: ${confLabel} (${Math.round(avgConf * 100)}%). ` +
      `${sections.length} sections generated.`
    ).slice(0, this.config.summaryMaxLength);
  }

  private determineRelation(
    a: ModalResult,
    b: ModalResult,
    similarity: number,
  ): LinkRelation {
    const keywords = new Set(extractKeywords(a.extracted.text));
    const bKeywords = extractKeywords(b.extracted.text);
    const overlap = bKeywords.filter((k) => keywords.has(k)).length;

    if (similarity > 0.7 && overlap >= 3) return "supports";
    if (similarity > 0.5 && overlap >= 2) return "extends";
    if (a.inputType === "chart" || a.inputType === "image") return "illustrates";
    return "extends";
  }

  private buildLinkExplanation(
    a: ModalResult,
    b: ModalResult,
    relation: LinkRelation,
  ): string {
    const aShort = a.extracted.text.slice(0, 80);
    const bShort = b.extracted.text.slice(0, 80);

    const verb: Record<LinkRelation, string> = {
      supports: "supports",
      contradicts: "contradicts",
      extends: "extends",
      illustrates: "illustrates",
    };

    return `"${aShort}" ${verb[relation]} "${bShort}"`;
  }

  private computeOverallConfidence(
    results: ModalResult[],
    links: CrossModalLink[],
  ): number {
    if (results.length === 0) return 0;
    const resultAvg =
      results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    const linkBonus = Math.min(links.length * 0.02, 0.1);
    return Math.round(Math.min(resultAvg + linkBonus, 1) * 100) / 100;
  }
}

// ── Factory ──────────────────────────────────────────────────────────

export function createMultiModalSynthesizer(
  config?: Partial<SynthesizerConfig>,
): MultiModalSynthesizer {
  return new MultiModalSynthesizer(config);
}
