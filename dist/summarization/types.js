/**
 * Summarization types - Data classes and interfaces for the summarization module
 */
export var SummarizationLength;
(function (SummarizationLength) {
    SummarizationLength["SHORT"] = "short";
    SummarizationLength["MEDIUM"] = "medium";
    SummarizationLength["LONG"] = "long";
})(SummarizationLength || (SummarizationLength = {}));
export var SummarizationStyle;
(function (SummarizationStyle) {
    SummarizationStyle["CONCISE"] = "concise";
    SummarizationStyle["DETAILED"] = "detailed";
    SummarizationStyle["TECHNICAL"] = "technical";
    SummarizationStyle["CASUAL"] = "casual";
})(SummarizationStyle || (SummarizationStyle = {}));
export var MessageRole;
(function (MessageRole) {
    MessageRole["SYSTEM"] = "system";
    MessageRole["USER"] = "user";
    MessageRole["ASSISTANT"] = "assistant";
})(MessageRole || (MessageRole = {}));
export function compressionRatio(result) {
    if (result.originalLength === 0)
        return 0;
    return 1.0 - result.summaryLength / result.originalLength;
}
//# sourceMappingURL=types.js.map