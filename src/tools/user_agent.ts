/**
 * User-Agent Rotation for web requests
 *
 * Copyright 2026 OpenClaw
 * Licensed under the Apache License, Version 2.0
 */

/**
 * Desktop browser User-Agents
 */
const DESKTOP_USER_AGENTS: string[] = [
  // Chrome on Windows
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
  // Chrome on macOS
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
  // Firefox on Windows
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
  // Firefox on macOS
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0",
  // Safari on macOS
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
  // Edge on Windows
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0",
];

/**
 * Mobile browser User-Agents
 */
const MOBILE_USER_AGENTS: string[] = [
  // Chrome on Android
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  // Safari on iOS
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
];

/**
 * Pool of User-Agent strings for rotation
 */
export class UserAgentPool {
  private agents: string[];

  /**
   * Initialize UserAgentPool
   * @param useMobile - Include mobile user agents
   */
  constructor(useMobile: boolean = false) {
    this.agents = [...DESKTOP_USER_AGENTS];
    if (useMobile) {
      this.agents.push(...MOBILE_USER_AGENTS);
    }
  }

  /**
   * Get a random user agent
   */
  get(): string {
    const index = Math.floor(Math.random() * this.agents.length);
    return this.agents[index] ?? DESKTOP_USER_AGENTS[0]!;
  }

  /**
   * Get a random desktop user agent
   */
  getDesktop(): string {
    const index = Math.floor(Math.random() * DESKTOP_USER_AGENTS.length);
    return DESKTOP_USER_AGENTS[index] ?? DESKTOP_USER_AGENTS[0]!;
  }

  /**
   * Get a random mobile user agent
   */
  getMobile(): string {
    const index = Math.floor(Math.random() * MOBILE_USER_AGENTS.length);
    return MOBILE_USER_AGENTS[index] ?? MOBILE_USER_AGENTS[0]!;
  }

  /**
   * Alias for get() for semantic clarity
   */
  rotate(): string {
    return this.get();
  }

  /**
   * Get headers dict with random user agent
   */
  static getHeaders(useMobile: boolean = false): Record<string, string> {
    const pool = new UserAgentPool(useMobile);
    return {
      "User-Agent": pool.get(),
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Accept-Encoding": "gzip, deflate",
      "Connection": "keep-alive",
      "Upgrade-Insecure-Requests": "1",
    };
  }
}

// Default pool instance
let defaultPool: UserAgentPool | null = null;

/**
 * Get a random user agent
 */
export function getUserAgent(useMobile: boolean = false): string {
  if (!defaultPool) {
    defaultPool = new UserAgentPool(useMobile);
  }
  return defaultPool.get();
}

/**
 * Get default headers with User-Agent
 */
export function getDefaultHeaders(): Record<string, string> {
  return UserAgentPool.getHeaders();
}

// Export all
export const USER_AGENTS = DESKTOP_USER_AGENTS;
export const MOBILE_USER_AGENTS_LIST = MOBILE_USER_AGENTS;

export default {
  UserAgentPool,
  getUserAgent,
  getDefaultHeaders,
  USER_AGENTS,
  MOBILE_USER_AGENTS: MOBILE_USER_AGENTS_LIST,
};