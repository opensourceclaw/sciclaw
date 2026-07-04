/**
 * Source Validation Module
 *
 * Validates URLs and content quality before extraction.
 *
 * Copyright 2026 OpenClaw
 * Licensed under the Apache License, Version 2.0
 */
/**
 * Validation status codes
 */
export declare enum ValidationStatus {
    VALID = "valid",
    INVALID_URL = "invalid_url",
    UNREACHABLE = "unreachable",
    TIMEOUT = "timeout",
    LOW_QUALITY = "low_quality",
    BLOCKED = "blocked",
    ERROR = "error"
}
/**
 * Content quality scores
 */
export declare enum QualityScore {
    EXCELLENT = 5,
    GOOD = 4,
    AVERAGE = 3,
    POOR = 2,
    VERY_POOR = 1
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
 * Validates URLs and content quality
 */
export declare class SourceValidator {
    private timeout;
    private static AD_DOMAINS;
    constructor(timeout?: number);
    /**
     * Validate a URL
     */
    validateUrl(url: string): Promise<ValidationResult>;
    /**
     * Validate multiple URLs
     */
    validateUrls(urls: string[]): Promise<ValidationResult[]>;
    /**
     * Filter list to only valid URLs
     */
    filterValidUrls(urls: string[]): Promise<string[]>;
    /**
     * Filter list to only recommended URLs (valid + good quality)
     */
    filterRecommendedUrls(urls: string[]): Promise<string[]>;
    /**
     * Check if URL has valid format
     */
    private isValidUrlFormat;
    /**
     * Check if domain is blocked
     */
    private isBlockedDomain;
    /**
     * Check if content type is allowed
     */
    private isAllowedContentType;
    /**
     * Calculate content quality score
     */
    private calculateQualityScore;
}
/**
 * Validate a single URL
 */
export declare function validateSource(url: string, timeout?: number): Promise<ValidationResult>;
/**
 * Validate multiple URLs
 */
export declare function validateSources(urls: string[], timeout?: number): Promise<ValidationResult[]>;
/**
 * Filter to only valid URLs
 */
export declare function filterValidSources(urls: string[], timeout?: number): Promise<string[]>;
declare const _default: {
    ValidationStatus: typeof ValidationStatus;
    QualityScore: typeof QualityScore;
    SourceValidator: typeof SourceValidator;
    validateSource: typeof validateSource;
    validateSources: typeof validateSources;
    filterValidSources: typeof filterValidSources;
};
export default _default;
//# sourceMappingURL=source_validation.d.ts.map