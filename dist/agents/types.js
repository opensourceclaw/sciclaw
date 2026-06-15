export var AgentRole;
(function (AgentRole) {
    AgentRole["PLANNING"] = "planning";
    AgentRole["SEARCH"] = "search";
    AgentRole["SYNTHESIS"] = "synthesis";
    AgentRole["WRITING"] = "writing";
})(AgentRole || (AgentRole = {}));
export var MessageType;
(function (MessageType) {
    MessageType["TASK"] = "task";
    MessageType["RESULT"] = "result";
    MessageType["QUERY"] = "query";
    MessageType["ERROR"] = "error";
    MessageType["STATUS"] = "status";
})(MessageType || (MessageType = {}));
export var AgentStatus;
(function (AgentStatus) {
    AgentStatus["IDLE"] = "idle";
    AgentStatus["BUSY"] = "busy";
    AgentStatus["ERROR"] = "error";
    AgentStatus["COMPLETED"] = "completed";
})(AgentStatus || (AgentStatus = {}));
//# sourceMappingURL=types.js.map