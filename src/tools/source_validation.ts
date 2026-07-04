/**
 * Source Validation Module
 *
 * Validates URLs and content quality before extraction.
 *
 * Copyright 2026 OpenClaw
 * Licensed under the Apache License, Version 2.0
 */

import axios, { AxiosError } from 'axios';
import { URL } from 'url';

/**
 * Validation status codes
 */
export enum ValidationStatus {
  VALID = "valid",
  INVALID_URL = "invalid_url",
  UNREACHABLE = "unreachable",
  TIMEOUT = "timeout",
  LOW_QUALITY = "low_quality",
  BLOCKED = "blocked",
  ERROR = "error",
}

/**
 * Content quality scores
 */
export enum QualityScore {
  EXCELLENT = 5,
  GOOD = 4,
  AVERAGE = 3,
  POOR = 2,
  VERY_POOR = 1,
}

/**
 * Result of URL validation
 */
export interface ValidationResult {
  url: string;
  status: ValidationStatus;
  qualityScore: QualityScore;
  errorMessage?: string;
  statusCode?: number;
  contentLength: number;
  contentType?: string;
  responseTime: number;
  metadata: Record<string, unknown>;
}

/**
 * Create a default validation result
 */
function createDefaultResult(url: string): ValidationResult {
  return {
    url,
    status: ValidationStatus.VALID,
    qualityScore: QualityScore.AVERAGE,
    contentLength: 0,
    responseTime: 0,
    metadata: {},
  };
}

// Blocked domains/patterns
const BLOCKED_DOMAINS: RegExp[] = [
  /\.onion$/i,
  /localhost/i,
  /127\.0\.0\.1/,
  /0\.0\.0\.0/,
  /\.local$/i,
];

// Content type whitelist
const ALLOWED_CONTENT_TYPES: string[] = [
  "text/html",
  "application/xhtml+xml",
];

// Minimum content length
const MIN_CONTENT_LENGTH = 100;

// Maximum content length (10MB)
const MAX_CONTENT_LENGTH = 10 * 1024 * 1024;

// Default timeout
const DEFAULT_TIMEOUT = 10000;

/**
 * Validates URLs and content quality
 */
export class SourceValidator {
  private timeout: number;

  // Known ad/tracking domains to filter
  private static AD_DOMAINS: string[] = [
    "doubleclick.net",
    "googlesyndication.com",
    "googleadservices.com",
    "facebook.net/tr.js",
    "analytics.google.com",
    "hotjar.com",
    "mixpanel.com",
    "segment.io",
    "newrelic.com",
  ];

  constructor(timeout: number = DEFAULT_TIMEOUT) {
    this.timeout = timeout;
  }

  /**
   * Validate a URL
   */
  async validateUrl(url: string): Promise<ValidationResult> {
    // Check URL format
    if (!this.isValidUrlFormat(url)) {
      return {
        ...createDefaultResult(url),
        status: ValidationStatus.INVALID_URL,
        errorMessage: "Invalid URL format",
      };
    }

    // Check if domain is blocked
    if (this.isBlockedDomain(url)) {
      return {
        ...createDefaultResult(url),
        status: ValidationStatus.BLOCKED,
        errorMessage: "Domain is blocked",
      };
    }

    // Try to reach the URL
    try {
      const startTime = Date.now();

      // HEAD request first
      const headResponse = await axios.head(url, {
        timeout: this.timeout,
        maxRedirects: 5,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; ResearchClaw/1.0)",
        },
      });

      const responseTime = Date.now() - startTime;

      // Check status code
      if (headResponse.status >= 400) {
        return {
          ...createDefaultResult(url),
          status: ValidationStatus.UNREACHABLE,
          statusCode: headResponse.status,
          errorMessage: `HTTP ${headResponse.status}`,
          responseTime,
        };
      }

      // Check content type
      const contentType = String(headResponse.headers['content-type'] || '');
      if (!this.isAllowedContentType(contentType)) {
        return {
          ...createDefaultResult(url),
          status: ValidationStatus.INVALID_URL,
          contentType,
          errorMessage: "Unsupported content type",
          responseTime,
        };
      }

      // GET request to check content length
      try {
        const getResponse = await axios.get<ArrayBuffer>(url, {
          timeout: this.timeout,
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; ResearchClaw/1.0)",
          },
          responseType: 'arraybuffer',
        });

        const contentLength = getResponse.data instanceof ArrayBuffer
          ? getResponse.data.byteLength
          : (getResponse.data as Buffer).length ?? 0;

        // Check content length
        if (contentLength < MIN_CONTENT_LENGTH) {
          return {
            ...createDefaultResult(url),
            status: ValidationStatus.LOW_QUALITY,
            statusCode: getResponse.status,
            contentLength,
            contentType: String(contentType),
            responseTime,
            errorMessage: "Content too short",
          };
        }

        // Calculate quality score
        const quality = this.calculateQualityScore(
          contentLength,
          responseTime,
          getResponse.status
        );

        return {
          ...createDefaultResult(url),
          status: ValidationStatus.VALID,
          statusCode: getResponse.status,
          qualityScore: quality,
          contentLength,
          contentType: String(contentType),
          responseTime,
        };
      } catch (getError) {
        if ((getError as AxiosError).code === 'ECONNABORTED') {
          return {
            ...createDefaultResult(url),
            status: ValidationStatus.TIMEOUT,
            errorMessage: "Request timeout",
            responseTime,
          };
        }
        throw getError;
      }
    } catch (error) {
      return {
        ...createDefaultResult(url),
        status: ValidationStatus.ERROR,
        errorMessage: (error as Error).message,
        responseTime: 0,
      };
    }
  }

  /**
   * Validate multiple URLs
   */
  async validateUrls(urls: string[]): Promise<ValidationResult[]> {
    return Promise.all(urls.map(url => this.validateUrl(url)));
  }

  /**
   * Filter list to only valid URLs
   */
  async filterValidUrls(urls: string[]): Promise<string[]> {
    const results = await this.validateUrls(urls);
    return results.filter(r => r.status === ValidationStatus.VALID).map(r => r.url);
  }

  /**
   * Filter list to only recommended URLs (valid + good quality)
   */
  async filterRecommendedUrls(urls: string[]): Promise<string[]> {
    const results = await this.validateUrls(urls);
    return results
      .filter(r => r.status === ValidationStatus.VALID && r.qualityScore >= QualityScore.GOOD)
      .map(r => r.url);
  }

  /**
   * Check if URL has valid format
   */
  private isValidUrlFormat(url: string): boolean {
    try {
      const parsed = new URL(url);
      return !!(parsed.protocol && parsed.host);
    } catch {
      return false;
    }
  }

  /**
   * Check if domain is blocked
   */
  private isBlockedDomain(url: string): boolean {
    let domain: string;
    try {
      const parsed = new URL(url);
      domain = parsed.host.toLowerCase();
    } catch {
      return false;
    }

    for (const pattern of BLOCKED_DOMAINS) {
      if (pattern.test(domain)) {
        return true;
      }
    }

    // Check for ad domains
    for (const adDomain of SourceValidator.AD_DOMAINS) {
      if (domain.includes(adDomain)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if content type is allowed
   */
  private isAllowedContentType(contentType: string): boolean {
    const ct = contentType.toLowerCase();
    return ALLOWED_CONTENT_TYPES.some(allowed => ct.includes(allowed));
  }

  /**
   * Calculate content quality score
   */
  private calculateQualityScore(
    contentLength: number,
    responseTime: number,
    statusCode: number
  ): QualityScore {
    let score = 3; // Start with average

    // Content length scoring
    if (contentLength > 10000) {
      score += 1;
    } else if (contentLength < 500) {
      score -= 1;
    }

    // Response time scoring
    if (responseTime < 1000) {
      score += 1;
    } else if (responseTime > 5000) {
      score -= 1;
    }

    // Clamp score
    score = Math.max(1, Math.min(5, score));

    return score as QualityScore;
  }
}

/**
 * Validate a single URL
 */
export async function validateSource(
  url: string,
  timeout: number = DEFAULT_TIMEOUT
): Promise<ValidationResult> {
  const validator = new SourceValidator(timeout);
  return validator.validateUrl(url);
}

/**
 * Validate multiple URLs
 */
export async function validateSources(
  urls: string[],
  timeout: number = DEFAULT_TIMEOUT
): Promise<ValidationResult[]> {
  const validator = new SourceValidator(timeout);
  return validator.validateUrls(urls);
}

/**
 * Filter to only valid URLs
 */
export async function filterValidSources(
  urls: string[],
  timeout: number = DEFAULT_TIMEOUT
): Promise<string[]> {
  const validator = new SourceValidator(timeout);
  return validator.filterValidUrls(urls);
}

// Export all
export default {
  ValidationStatus,
  QualityScore,
  SourceValidator,
  validateSource,
  validateSources,
  filterValidSources,
};