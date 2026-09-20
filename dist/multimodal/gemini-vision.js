/**
 * SciClaw v3.3.0 — Gemini Vision Adapter
 *
 * Image analysis powered by Gemini Vision via OpenClaw Gateway.
 * Flash (default) with automatic Pro fallback for low-confidence results.
 */
import { OpenClawModelAdapter } from "@sciclaw/core";
import { ContentCategory, ChartType } from "./types.js";
export const DEFAULT_GEMINI_VISION_CONFIG = {
    defaultModel: "gemini-2.5-flash",
    proFallbackEnabled: true,
    proFallbackThreshold: 0.75,
    maxProFallbacksPerSession: 5,
};
// ── Adapter ──────────────────────────────────────────────────────────
export class GeminiVisionAdapter {
    adapter;
    config;
    proFallbackCount = 0;
    constructor(adapterConfig, visionConfig) {
        this.adapter = new OpenClawModelAdapter(adapterConfig);
        this.config = { ...DEFAULT_GEMINI_VISION_CONFIG, ...visionConfig };
    }
    /** Analyze an image with vision capabilities. */
    async analyzeImage(image, prompt) {
        const analysisPrompt = prompt ??
            `Analyze this image in detail. Provide:
1. Overall description (2-3 sentences)
2. Category: photograph, diagram, chart, screenshot, or document
3. All visible text (OCR)
4. Main objects detected
5. Contextual insights or interpretation

Respond in JSON format:
{
  "description": "...",
  "category": "photograph|diagram|chart|screenshot|document",
  "textContent": "...",
  "objects": [{"label": "...", "confidence": 0.95}],
  "contextualInsights": "...",
  "confidence": 0.0-1.0
}`;
        const result = await this.callVision(this.config.defaultModel, image, analysisPrompt);
        if (this.config.proFallbackEnabled &&
            result.confidence < this.config.proFallbackThreshold &&
            this.proFallbackCount < this.config.maxProFallbacksPerSession) {
            this.proFallbackCount++;
            return this.callVision("gemini-2.5-pro", image, analysisPrompt);
        }
        return result;
    }
    /** Interpret a chart image (bar, line, pie, scatter). */
    async interpretChart(image) {
        const prompt = `Analyze this chart. Extract:
1. Chart type (bar/line/pie/scatter/area/histogram)
2. Title
3. Axis labels
4. Data series with labels and values
5. Overall trend or insight

Respond in JSON:
{
  "type": "bar|line|pie|scatter|area|histogram",
  "title": "...",
  "labels": ["...", "..."],
  "datasets": [{"label": "...", "values": [1, 2, 3]}],
  "axes": {"xLabel": "...", "yLabel": "..."},
  "description": "...",
  "confidence": 0.0-1.0
}`;
        const result = await this.callVision(this.config.defaultModel, image, prompt);
        if (this.config.proFallbackEnabled &&
            result.confidence < this.config.proFallbackThreshold &&
            this.proFallbackCount < this.config.maxProFallbacksPerSession) {
            this.proFallbackCount++;
            return this.parseChartResult(await this.callVision("gemini-2.5-pro", image, prompt));
        }
        return this.parseChartResult(result);
    }
    /** Parse a diagram (flowchart, architecture diagram). */
    async readDiagram(image) {
        const prompt = `Analyze this diagram. Identify:
1. Type (flowchart/architecture/sequence/er/unknown)
2. Overall description
3. All entities (boxes, nodes)
4. All relationships (arrows, lines between entities)

Respond in JSON:
{
  "type": "flowchart|architecture|sequence|er|unknown",
  "description": "...",
  "entities": ["..."],
  "relationships": [{"from": "...", "to": "...", "label": "..."}],
  "confidence": 0.0-1.0
}`;
        const result = await this.callVision(this.config.defaultModel, image, prompt);
        try {
            const parsed = JSON.parse(result.textContent || "{}");
            return {
                type: parsed.type ?? "unknown",
                description: parsed.description ?? result.description,
                entities: parsed.entities ?? [],
                relationships: parsed.relationships ?? [],
                confidence: parsed.confidence ?? result.confidence,
            };
        }
        catch {
            return {
                type: "unknown",
                description: result.description,
                entities: [],
                relationships: [],
                confidence: result.confidence,
            };
        }
    }
    /** Extract content from a screenshot. */
    async extractScreenshot(image) {
        const prompt = `Analyze this screenshot. Extract:
1. Overall context (what app/page is this)
2. All visible text
3. UI elements (buttons, links, inputs, etc.)
4. Contextual description

Respond in JSON:
{
  "description": "...",
  "uiElements": ["...", "..."],
  "textContent": "...",
  "context": "...",
  "confidence": 0.0-1.0
}`;
        const result = await this.callVision(this.config.defaultModel, image, prompt);
        try {
            const parsed = JSON.parse(result.textContent || "{}");
            return {
                description: parsed.description ?? result.description,
                uiElements: parsed.uiElements ?? [],
                textContent: parsed.textContent ?? result.textContent,
                context: parsed.context ?? "",
                confidence: parsed.confidence ?? result.confidence,
            };
        }
        catch {
            return {
                description: result.description,
                uiElements: [],
                textContent: result.textContent,
                context: "",
                confidence: result.confidence,
            };
        }
    }
    getProFallbackCount() {
        return this.proFallbackCount;
    }
    resetProFallbackCount() {
        this.proFallbackCount = 0;
    }
    // ── Private ────────────────────────────────────────────────────────
    async callVision(model, image, prompt) {
        const base64Image = image.toString("base64");
        const response = await this.adapter.chat({
            messages: [
                {
                    role: "user",
                    content: JSON.stringify({
                        text: prompt,
                        image: base64Image,
                    }),
                },
            ],
            task: "analysis",
            options: {
                model,
                temperature: 0.1,
                maxTokens: 4096,
            },
        });
        return this.parseVisionResponse(response.content, model);
    }
    parseVisionResponse(text, model) {
        try {
            // Attempt JSON parse
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    description: parsed.description ?? text,
                    category: this.parseCategory(parsed.category),
                    objects: Array.isArray(parsed.objects)
                        ? parsed.objects.map((o) => ({
                            label: o.label ?? "unknown",
                            confidence: o.confidence ?? 0.7,
                            boundingBox: { x: 0, y: 0, width: 100, height: 100 },
                        }))
                        : [],
                    textContent: parsed.textContent ?? "",
                    contextualInsights: parsed.contextualInsights ?? "",
                    confidence: parsed.confidence ?? 0.7,
                    model,
                };
            }
        }
        catch {
            // Fall through to raw text parsing
        }
        return {
            description: text.slice(0, 500),
            category: ContentCategory.UNKNOWN,
            objects: [],
            textContent: text,
            contextualInsights: "",
            confidence: 0.5,
            model,
        };
    }
    parseCategory(raw) {
        const mapping = {
            photograph: ContentCategory.PHOTOGRAPH,
            photo: ContentCategory.PHOTOGRAPH,
            diagram: ContentCategory.DIAGRAM,
            chart: ContentCategory.CHART,
            graph: ContentCategory.CHART,
            screenshot: ContentCategory.SCREENSHOT,
            document: ContentCategory.DOCUMENT,
        };
        return mapping[raw?.toLowerCase()] ?? ContentCategory.UNKNOWN;
    }
    parseChartResult(result) {
        try {
            const jsonMatch = result.textContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    type: this.parseChartType(parsed.type),
                    title: parsed.title,
                    labels: parsed.labels ?? [],
                    datasets: (parsed.datasets ?? []).map((ds) => ({
                        label: ds.label ?? "",
                        values: ds.values ?? [],
                    })),
                    axes: {
                        xLabel: parsed.axes?.xLabel,
                        yLabel: parsed.axes?.yLabel,
                    },
                    rawDescription: parsed.description ?? result.description,
                    extractionConfidence: parsed.confidence ?? result.confidence,
                };
            }
        }
        catch {
            // Use raw response
        }
        return {
            type: ChartType.UNKNOWN,
            labels: [],
            datasets: [],
            axes: {},
            rawDescription: result.description,
            extractionConfidence: result.confidence,
        };
    }
    parseChartType(raw) {
        const mapping = {
            bar: ChartType.BAR,
            line: ChartType.LINE,
            pie: ChartType.PIE,
            scatter: ChartType.SCATTER,
            area: ChartType.AREA,
            histogram: ChartType.HISTOGRAM,
        };
        return mapping[raw?.toLowerCase()] ?? ChartType.UNKNOWN;
    }
}
export function createGeminiVisionAdapter(adapterConfig, visionConfig) {
    return new GeminiVisionAdapter(adapterConfig, visionConfig);
}
//# sourceMappingURL=gemini-vision.js.map