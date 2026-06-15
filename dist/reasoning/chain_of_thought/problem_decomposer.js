/**
 * Problem Decomposer - Breaks complex questions into ordered sub-problems
 */
import { DecompositionStrategy, StepStatus, } from './types.js';
const DEFAULT_CONFIG = {
    maxDepth: 5,
    maxSteps: 20,
    retryCount: 3,
    timeoutMs: 30000,
};
function classifyQuestion(question) {
    const q = question.toLowerCase().trim();
    if (q.includes('?') && (q.match(/\?/g)?.length ?? 0) > 1)
        return 'multi';
    if (/^(what|who|when|where|哪个|谁|什么|什么时候|哪里)/.test(q))
        return 'factual';
    if (/^(why|how\s+(come|is|does)|为什么|怎么(会|能|可能))/i.test(q))
        return 'causal';
    if (/^(how\s+(to|do|can|should)|步骤|如何|怎样)/i.test(q))
        return 'procedural';
    if (/(compare|difference|vs|versus|区别|对比|不同|比较)/i.test(q))
        return 'comparison';
    // Fallback: check for multiple clauses
    if (/[,，;；、]/.test(q) || /(and|与|和|以及|同时)/.test(q))
        return 'multi';
    return 'factual';
}
function generateId() {
    return Math.random().toString(36).slice(2, 10);
}
function getMaxChildren(strategy) {
    switch (strategy) {
        case DecompositionStrategy.BROAD: return 5;
        case DecompositionStrategy.DEEP: return 2;
        case DecompositionStrategy.BALANCED: return 3;
    }
}
export class ProblemDecomposer {
    config;
    constructor(config) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    decompose(question, strategy = DecompositionStrategy.BALANCED) {
        if (!question || !question.trim())
            return [];
        const steps = [];
        const qType = classifyQuestion(question);
        // Root step is always the original question
        steps.push(this.makeStep(0, question, undefined, strategy, 0, []));
        switch (qType) {
            case 'causal':
                this.decomposeCausal(question, strategy, steps);
                break;
            case 'procedural':
                this.decomposeProcedural(question, strategy, steps);
                break;
            case 'comparison':
                this.decomposeComparison(question, strategy, steps);
                break;
            case 'multi':
                this.decomposeMulti(question, strategy, steps);
                break;
            case 'factual':
            default:
                // Single-step question, no further decomposition
                break;
        }
        // Enforce max steps
        if (steps.length > this.config.maxSteps) {
            return steps.slice(0, this.config.maxSteps);
        }
        return steps;
    }
    decomposeCausal(question, strategy, steps) {
        const rootId = steps[0].id;
        const maxChildren = getMaxChildren(strategy);
        const subSteps = [
            'What are the direct causes?',
            'What are the effects or consequences?',
            'What is the underlying mechanism?',
        ].slice(0, maxChildren);
        for (let i = 0; i < subSteps.length; i++) {
            if (steps.length >= this.config.maxSteps)
                break;
            steps.push(this.makeStep(steps.length, subSteps[i], rootId, strategy, 1, [rootId]));
        }
    }
    decomposeProcedural(question, strategy, steps) {
        const rootId = steps[0].id;
        const maxChildren = getMaxChildren(strategy);
        const subSteps = [
            'What are the prerequisites?',
            'What is the first step?',
            'What are the key milestones?',
            'What is the expected outcome?',
        ].slice(0, maxChildren);
        let prevId = rootId;
        for (let i = 0; i < subSteps.length; i++) {
            if (steps.length >= this.config.maxSteps)
                break;
            const id = this.makeStep(steps.length, subSteps[i], rootId, strategy, 1, i === 0 ? [rootId] : [rootId, prevId]);
            steps.push(id);
            prevId = id.id;
        }
    }
    decomposeComparison(question, strategy, steps) {
        const rootId = steps[0].id;
        const maxChildren = getMaxChildren(strategy);
        const subSteps = [
            'What are the similarities?',
            'What are the differences?',
            'Which is better or more suitable?',
        ].slice(0, maxChildren);
        for (let i = 0; i < subSteps.length; i++) {
            if (steps.length >= this.config.maxSteps)
                break;
            steps.push(this.makeStep(steps.length, subSteps[i], rootId, strategy, 1, [rootId]));
        }
    }
    decomposeMulti(question, strategy, steps) {
        const rootId = steps[0].id;
        const maxChildren = getMaxChildren(strategy);
        // Split by punctuation to extract sub-questions
        const parts = question.split(/[,，;；、]|(?:and|与|和|以及|同时)/)
            .map((s) => s.trim().replace(/^(what|how|why|who|when)\s+/i, ''))
            .filter((s) => s.length > 5)
            .slice(0, maxChildren);
        for (const part of parts) {
            if (steps.length >= this.config.maxSteps)
                break;
            steps.push(this.makeStep(steps.length, part, rootId, strategy, 1, [rootId]));
        }
    }
    makeStep(stepNumber, subQuestion, parentId, strategy, depth, dependencies) {
        return {
            id: generateId(),
            stepNumber,
            subQuestion,
            parentId,
            dependencies,
            strategy,
            depth: Math.min(depth, this.config.maxDepth),
            status: StepStatus.PENDING,
        };
    }
}
//# sourceMappingURL=problem_decomposer.js.map