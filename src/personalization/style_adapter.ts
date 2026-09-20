/**
 * SciClaw v3.0.0-rc.2 — Style Adapter
 *
 * Adapts report generation to user's preferred research style.
 * 4 styles: academic, business, technical, quick — each with distinct
 * tone, structure, and output characteristics.
 */
import type {
  ResearchStyle,
  StyleProfile,
  StyleTone,
  StyleStructure,
  UserPreferences,
} from "./types.js";

// ── Style Definitions ──────────────────────────────────────────────────

const STYLE_PROFILES: Record<ResearchStyle, StyleProfile> = {
  academic: {
    style: "academic",
    tone: { formality: 0.95, technicality: 0.8, conciseness: 0.3 },
    structure: {
      includeAbstract: true,
      includeMethodology: true,
      includeExecutiveSummary: false,
      includeCodeExamples: false,
      includeAppendix: true,
      maxSections: 10,
    },
    citationStyle: "apa",
  },
  business: {
    style: "business",
    tone: { formality: 0.7, technicality: 0.4, conciseness: 0.85 },
    structure: {
      includeAbstract: false,
      includeMethodology: false,
      includeExecutiveSummary: true,
      includeCodeExamples: false,
      includeAppendix: false,
      maxSections: 5,
    },
    citationStyle: "inline",
  },
  technical: {
    style: "technical",
    tone: { formality: 0.6, technicality: 0.95, conciseness: 0.5 },
    structure: {
      includeAbstract: false,
      includeMethodology: true,
      includeExecutiveSummary: false,
      includeCodeExamples: true,
      includeAppendix: true,
      maxSections: 8,
    },
    citationStyle: "inline",
  },
  quick: {
    style: "quick",
    tone: { formality: 0.3, technicality: 0.3, conciseness: 0.95 },
    structure: {
      includeAbstract: false,
      includeMethodology: false,
      includeExecutiveSummary: false,
      includeCodeExamples: false,
      includeAppendix: false,
      maxSections: 3,
    },
    citationStyle: "inline",
  },
};

// ── Style Adapter ──────────────────────────────────────────────────────

export class StyleAdapter {
  private currentStyle: ResearchStyle;

  constructor(initialStyle?: ResearchStyle) {
    this.currentStyle = initialStyle ?? "technical";
  }

  /** Get the full style profile for the current or specified style */
  getProfile(style?: ResearchStyle): StyleProfile {
    return { ...STYLE_PROFILES[style ?? this.currentStyle] };
  }

  /** Get all available style names */
  getAvailableStyles(): ResearchStyle[] {
    return ["academic", "business", "technical", "quick"];
  }

  /** Apply user preferences to determine the best style */
  applyPreferences(prefs: UserPreferences): StyleProfile {
    this.currentStyle = prefs.style;
    return this.getProfile();
  }

  /** Adapt a report section title based on current style */
  adaptSectionTitle(rawTitle: string): string {
    const profile = this.getProfile();
    const title = rawTitle.trim();

    switch (profile.style) {
      case "academic":
        return this._academicTitle(title);
      case "business":
        return this._businessTitle(title);
      case "quick":
        return this._quickTitle(title);
      default:
        return title;
    }
  }

  /** Generate style-appropriate section ordering */
  getSectionOrder(): string[] {
    const profile = this.getProfile();
    const base = ["introduction", "findings", "analysis", "conclusion"];

    switch (profile.style) {
      case "academic":
        return [
          "abstract",
          "introduction",
          "literature_review",
          "methodology",
          "findings",
          "discussion",
          "conclusion",
          "references",
          "appendix",
        ];
      case "business":
        return [
          "executive_summary",
          "key_findings",
          "analysis",
          "recommendations",
          "next_steps",
        ];
      case "quick":
        return ["key_points", "summary", "sources"];
      default:
        return base;
    }
  }

  /** Adapt content tone markers for the current style */
  getToneGuidelines(): string[] {
    const tone = this.getProfile().tone;

    const guidelines: string[] = [];

    if (tone.formality >= 0.8) {
      guidelines.push("Use formal academic language, avoid contractions");
    } else if (tone.formality <= 0.4) {
      guidelines.push("Use conversational tone, contractions are fine");
    }

    if (tone.technicality >= 0.8) {
      guidelines.push("Include technical terminology and detailed explanations");
    } else if (tone.technicality <= 0.4) {
      guidelines.push("Avoid jargon, use plain language explanations");
    }

    if (tone.conciseness >= 0.8) {
      guidelines.push("Keep content brief, use bullet points, avoid lengthy paragraphs");
    } else if (tone.conciseness <= 0.4) {
      guidelines.push("Provide thorough explanations with full context");
    }

    return guidelines;
  }

  /** Get recommended max word count per section */
  getMaxWordsPerSection(): number {
    switch (this.currentStyle) {
      case "academic":
        return 2000;
      case "business":
        return 800;
      case "technical":
        return 1500;
      case "quick":
        return 300;
    }
  }

  /** Check if a structural element should be included */
  shouldInclude(element: Exclude<keyof StyleStructure, "maxSections">): boolean {
    return this.getProfile().structure[element] as boolean;
  }

  get current(): ResearchStyle {
    return this.currentStyle;
  }

  // ── Private ──────────────────────────────────────────────────────────

  private _academicTitle(title: string): string {
    if (!title.endsWith(".")) return title;
    return title.slice(0, -1);
  }

  private _businessTitle(title: string): string {
    // Capitalize key action words
    return title.replace(/\b(analysis|findings|recommendations|strategy|report)\b/gi,
      (m) => m.charAt(0).toUpperCase() + m.slice(1).toLowerCase());
  }

  private _quickTitle(title: string): string {
    // Shorter titles for quick style
    if (title.length > 50) {
      return title.slice(0, 47) + "...";
    }
    return title;
  }
}

/** Factory */
export function createStyleAdapter(
  initialStyle?: ResearchStyle,
): StyleAdapter {
  return new StyleAdapter(initialStyle);
}
