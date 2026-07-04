/**
 * Smart Sectioning - Automatic chapter detection and theme recognition
 *
 * Copyright 2026 OpenClaw
 * Licensed under the Apache License, Version 2.0
 */
/**
 * Common research section patterns
 */
const SECTION_PATTERNS = {
    introduction: ["introduction", "background", "overview", "context"],
    methods: ["method", "approach", "methodology", "research design", "procedure"],
    results: ["result", "finding", "observation", "data", "analysis"],
    discussion: ["discussion", "interpretation", "implication", "limitations"],
    conclusion: ["conclusion", "summary", "takeaway", "final"],
    references: ["reference", "bibliography", "citation", "source"],
};
/**
 * Automatic section detection and theme recognition
 */
export class SmartSectioner {
    llmEngine;
    constructor(llmEngine) {
        this.llmEngine = llmEngine ?? null;
    }
    /**
     * Detect sections in content
     */
    async detectSections(content, minSectionLength = 100) {
        // Try LLM-based detection first
        if (this.llmEngine) {
            try {
                return await this.detectSectionsLLM(content, minSectionLength);
            }
            catch {
                // Fall through to pattern-based detection
            }
        }
        // Fallback to pattern-based detection
        return this.detectSectionsPattern(content, minSectionLength);
    }
    /**
     * Detect sections using LLM
     */
    async detectSectionsLLM(content, _minSectionLength) {
        const prompt = `Analyze the following text and identify the main sections/subsections.

Text:
${content.slice(0, 3000)}

Respond with a JSON array of sections, each with:
- "title": section title
- "content": main content of this section (abbreviated if long)
- "confidence": how confident you are this is a real section (0-1)
- "keywords": key terms in this section
- "theme": main theme/category

Return ONLY valid JSON.`;
        const response = await this.llmEngine.chatSimple(prompt, "You are a document structure analyzer. Always respond with valid JSON.");
        const sectionsData = JSON.parse(response);
        const sections = sectionsData.map((s) => ({
            title: s.title || "Untitled",
            content: s.content || "",
            startPosition: 0,
            endPosition: 0,
            confidence: s.confidence ?? 0.5,
            keywords: s.keywords || [],
            theme: s.theme || "",
        }));
        // Extract unique themes
        const themes = [...new Set(sections.map((s) => s.theme).filter(Boolean))];
        return {
            sections,
            themes,
            structureScore: sections.reduce((sum, s) => sum + s.confidence, 0) / Math.max(sections.length, 1),
            suggestedOrder: sections.map((s) => s.title),
        };
    }
    /**
     * Detect sections using pattern matching
     */
    detectSectionsPattern(content, minSectionLength) {
        const sections = [];
        const lines = content.split("\n");
        let currentSection = null;
        const currentContent = [];
        let currentPos = 0;
        // Header patterns
        const headerPattern = /^(#{1,6})\s+(.+)$|^([A-Z][^.]{5,50})\.\s*$/;
        for (const line of lines) {
            // Check for markdown headers
            const headerMatch = line.match(headerPattern);
            if (headerMatch) {
                // Save previous section
                if (currentSection && currentContent.length > 0) {
                    const contentText = currentContent.join("\n");
                    if (contentText.length >= minSectionLength) {
                        currentSection.content = contentText;
                        currentSection.endPosition = currentPos;
                        sections.push(currentSection);
                    }
                }
                // Start new section
                const title = headerMatch[2] || headerMatch[3];
                if (!title)
                    continue;
                currentSection = {
                    title: title.trim(),
                    content: "",
                    startPosition: currentPos,
                    endPosition: 0,
                    confidence: 0.7,
                    theme: "",
                    keywords: [],
                };
                currentContent.length = 0;
            }
            currentPos += line.length + 1;
            if (currentSection) {
                currentContent.push(line);
            }
        }
        // Save last section
        if (currentSection && currentContent.length > 0) {
            currentSection.content = currentContent.join("\n");
            currentSection.endPosition = currentPos;
            sections.push(currentSection);
        }
        // If no sections detected, create single section
        if (sections.length === 0) {
            sections.push({
                title: "Overview",
                content: content,
                startPosition: 0,
                endPosition: content.length,
                confidence: 0.5,
                theme: "",
                keywords: [],
            });
        }
        // Identify themes
        const themes = this.identifyThemes(sections);
        return {
            sections,
            themes,
            structureScore: 0.6,
            suggestedOrder: sections.map((s) => s.title),
        };
    }
    /**
     * Identify themes from sections
     */
    identifyThemes(sections) {
        const themeCounts = new Map();
        for (const section of sections) {
            const titleLower = section.title.toLowerCase();
            for (const [theme, keywords] of Object.entries(SECTION_PATTERNS)) {
                if (keywords.some((kw) => titleLower.includes(kw))) {
                    themeCounts.set(theme, (themeCounts.get(theme) || 0) + 1);
                }
            }
        }
        // Return themes sorted by frequency
        return [...themeCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([theme]) => theme);
    }
    /**
     * Group sections by theme
     */
    groupByTheme(sections) {
        const themeGroups = new Map();
        for (const section of sections) {
            const theme = section.theme || this.classifySectionTheme(section);
            if (!themeGroups.has(theme)) {
                themeGroups.set(theme, []);
            }
            themeGroups.get(theme).push(section);
        }
        return themeGroups;
    }
    /**
     * Classify section into a theme
     */
    classifySectionTheme(section) {
        const titleLower = section.title.toLowerCase();
        const contentLower = section.content.toLowerCase().slice(0, 500);
        for (const [theme, keywords] of Object.entries(SECTION_PATTERNS)) {
            if (keywords.some((kw) => titleLower.includes(kw))) {
                return theme;
            }
            if (keywords.some((kw) => contentLower.includes(kw))) {
                return theme;
            }
        }
        return "general";
    }
    /**
     * Optimize section ordering
     */
    optimizeOrder(sections) {
        const preferredOrder = [
            "introduction",
            "background",
            "overview",
            "methods",
            "methodology",
            "approach",
            "results",
            "findings",
            "analysis",
            "discussion",
            "interpretation",
            "conclusion",
            "summary",
        ];
        const getOrderScore = (section) => {
            const theme = this.classifySectionTheme(section);
            const index = preferredOrder.indexOf(theme);
            return index >= 0 ? index : preferredOrder.length;
        };
        return [...sections].sort((a, b) => getOrderScore(a) - getOrderScore(b));
    }
    /**
     * Split content into chunks
     */
    splitContent(content, maxChars = 4000) {
        if (content.length <= maxChars) {
            return [content];
        }
        const chunks = [];
        const paragraphs = content.split("\n\n");
        let currentChunk = "";
        for (const para of paragraphs) {
            if (currentChunk.length + para.length > maxChars) {
                if (currentChunk) {
                    chunks.push(currentChunk);
                }
                currentChunk = para;
            }
            else {
                currentChunk += "\n\n" + para;
            }
        }
        if (currentChunk) {
            chunks.push(currentChunk);
        }
        return chunks.slice(0, 10); // Limit chunks
    }
    /**
     * Calculate section detection accuracy
     */
    calculateAccuracy(detected, groundTruth) {
        if (groundTruth.length === 0) {
            return 0.0;
        }
        // Normalize titles for comparison
        const normalize = (title) => title.toLowerCase().trim();
        const detectedNormalized = new Set(detected.map((s) => normalize(s.title)));
        const truthNormalized = new Set(groundTruth.map(normalize));
        // Calculate precision and recall
        let truePositives = 0;
        for (const title of detectedNormalized) {
            if (truthNormalized.has(title)) {
                truePositives++;
            }
        }
        const precision = detectedNormalized.size > 0
            ? truePositives / detectedNormalized.size
            : 0;
        const recall = truthNormalized.size > 0 ? truePositives / truthNormalized.size : 0;
        // F1 score
        if (precision + recall === 0) {
            return 0.0;
        }
        return (2 * (precision * recall)) / (precision + recall);
    }
}
/**
 * Create default sectioner instance
 */
export const smartSectioner = new SmartSectioner();
//# sourceMappingURL=smart_sectioning.js.map