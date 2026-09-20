/**
 * SciClaw v3.0.0-rc.2 — Style Adapter
 *
 * Adapts report generation to user's preferred research style.
 * 4 styles: academic, business, technical, quick — each with distinct
 * tone, structure, and output characteristics.
 */
import type { ResearchStyle, StyleProfile, StyleStructure, UserPreferences } from "./types.js";
export declare class StyleAdapter {
    private currentStyle;
    constructor(initialStyle?: ResearchStyle);
    /** Get the full style profile for the current or specified style */
    getProfile(style?: ResearchStyle): StyleProfile;
    /** Get all available style names */
    getAvailableStyles(): ResearchStyle[];
    /** Apply user preferences to determine the best style */
    applyPreferences(prefs: UserPreferences): StyleProfile;
    /** Adapt a report section title based on current style */
    adaptSectionTitle(rawTitle: string): string;
    /** Generate style-appropriate section ordering */
    getSectionOrder(): string[];
    /** Adapt content tone markers for the current style */
    getToneGuidelines(): string[];
    /** Get recommended max word count per section */
    getMaxWordsPerSection(): number;
    /** Check if a structural element should be included */
    shouldInclude(element: Exclude<keyof StyleStructure, "maxSections">): boolean;
    get current(): ResearchStyle;
    private _academicTitle;
    private _businessTitle;
    private _quickTitle;
}
/** Factory */
export declare function createStyleAdapter(initialStyle?: ResearchStyle): StyleAdapter;
//# sourceMappingURL=style_adapter.d.ts.map