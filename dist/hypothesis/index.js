import { createHypothesisGenerator, } from "./generator.js";
import { createHypothesisRanker } from "./ranker.js";
import { createHypothesisValidator, } from "./validator.js";
export * from "./types.js";
export * from "./generator.js";
export * from "./ranker.js";
export * from "./validator.js";
// ── HypothesisEngine ───────────────────────────────────────────────────
export class HypothesisEngine {
    generator;
    ranker;
    validator;
    constructor(config) {
        this.generator = createHypothesisGenerator(config?.generator);
        this.ranker = createHypothesisRanker(config?.ranker);
        this.validator = createHypothesisValidator(config?.validator);
    }
    generate(evidence) {
        return this.generator.generate(evidence);
    }
    rank(hypotheses) {
        return this.ranker.rank(hypotheses);
    }
    validate(hypothesis) {
        return this.validator.validate(hypothesis);
    }
    generateAndRank(evidence) {
        const hypotheses = this.generator.generate(evidence);
        return this.ranker.rank(hypotheses);
    }
    generateRankAndValidate(evidence) {
        const hypotheses = this.generator.generate(evidence);
        const ranked = this.ranker.rank(hypotheses);
        const validations = new Map();
        for (const r of ranked) {
            validations.set(r.hypothesis.id, this.validator.validate(r.hypothesis));
        }
        return { ranked, validations };
    }
    getStats() {
        const genStats = this.generator.getStats();
        const valStats = this.validator.getValidationStats();
        return {
            totalGenerated: genStats.totalGenerated,
            totalRanked: genStats.totalGenerated, // rank is called after generate
            totalValidated: valStats.totalValidated,
        };
    }
    getGenerator() {
        return this.generator;
    }
    getRanker() {
        return this.ranker;
    }
    getValidator() {
        return this.validator;
    }
}
export function createHypothesisEngine(config) {
    return new HypothesisEngine(config);
}
//# sourceMappingURL=index.js.map