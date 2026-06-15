/**
 * Skill module - OpenClaw Skill Integration for DeepClaw
 */
export var ResearchDepth;
(function (ResearchDepth) {
    ResearchDepth["QUICK"] = "quick";
    ResearchDepth["STANDARD"] = "standard";
    ResearchDepth["DEEP"] = "deep";
})(ResearchDepth || (ResearchDepth = {}));
export var OutputFormat;
(function (OutputFormat) {
    OutputFormat["MARKDOWN"] = "markdown";
    OutputFormat["HTML"] = "html";
    OutputFormat["PDF"] = "pdf";
})(OutputFormat || (OutputFormat = {}));
export class BaseResearchSkill {
}
export class ResearchSkill extends BaseResearchSkill {
    name = 'DeepClaw';
    version = '2.0.0-rc.3';
    description = 'AI-powered deep research framework';
    initialized = false;
    researchResults = new Map();
    initialize() {
        try {
            this.initialized = true;
            return true;
        }
        catch {
            return false;
        }
    }
    execute(request) {
        if (!this.initialized) {
            if (!this.initialize()) {
                return {
                    request,
                    status: 'error',
                    sources: [],
                    error: 'Failed to initialize skill',
                };
            }
        }
        const result = {
            request,
            status: 'running',
            sources: [],
        };
        result.status = 'completed';
        result.sources = [];
        const id = `result_${Date.now()}`;
        this.researchResults.set(id, result);
        return result;
    }
    getStatus() {
        return {
            name: this.name,
            version: this.version,
            initialized: this.initialized,
            resultsCount: this.researchResults.size,
        };
    }
    shutdown() {
        try {
            this.researchResults.clear();
            this.initialized = false;
            return true;
        }
        catch {
            return false;
        }
    }
    getResult(resultId) {
        return this.researchResults.get(resultId);
    }
    listResults() {
        return Array.from(this.researchResults.entries()).map(([id, r]) => ({
            id,
            status: r.status,
            topic: r.request.topic,
        }));
    }
}
//# sourceMappingURL=index.js.map