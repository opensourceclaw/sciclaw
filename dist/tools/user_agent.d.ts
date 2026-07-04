/**
 * User-Agent Rotation for web requests
 *
 * Copyright 2026 OpenClaw
 * Licensed under the Apache License, Version 2.0
 */
/**
 * Pool of User-Agent strings for rotation
 */
export declare class UserAgentPool {
    private agents;
    /**
     * Initialize UserAgentPool
     * @param useMobile - Include mobile user agents
     */
    constructor(useMobile?: boolean);
    /**
     * Get a random user agent
     */
    get(): string;
    /**
     * Get a random desktop user agent
     */
    getDesktop(): string;
    /**
     * Get a random mobile user agent
     */
    getMobile(): string;
    /**
     * Alias for get() for semantic clarity
     */
    rotate(): string;
    /**
     * Get headers dict with random user agent
     */
    static getHeaders(useMobile?: boolean): Record<string, string>;
}
/**
 * Get a random user agent
 */
export declare function getUserAgent(useMobile?: boolean): string;
/**
 * Get default headers with User-Agent
 */
export declare function getDefaultHeaders(): Record<string, string>;
export declare const USER_AGENTS: string[];
export declare const MOBILE_USER_AGENTS_LIST: string[];
declare const _default: {
    UserAgentPool: typeof UserAgentPool;
    getUserAgent: typeof getUserAgent;
    getDefaultHeaders: typeof getDefaultHeaders;
    USER_AGENTS: string[];
    MOBILE_USER_AGENTS: string[];
};
export default _default;
//# sourceMappingURL=user_agent.d.ts.map