import crypto from "crypto";
import { VerificationStatus, ClaimType } from "./types.js";
export class FactCheckService {
    cacheTTL;
    cache = new Map();
    constructor(cacheTTLMinutes = 30) {
        this.cacheTTL = cacheTTLMinutes * 60 * 1000;
    }
    async verifyClaim(claim, referenceSources = []) {
        const cacheKey = this.cacheKey(claim);
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() < cached.expiresAt)
            return cached.result;
        const result = this.verifyInternal(claim, referenceSources);
        this.cache.set(cacheKey, { result, expiresAt: Date.now() + this.cacheTTL });
        return result;
    }
    async verifyClaims(claims, referenceSources = []) {
        return Promise.all(claims.map((c) => this.verifyClaim(c, referenceSources)));
    }
    async verifySource(url, claims) {
        const results = await this.verifyClaims(claims);
        const verified = results.filter((r) => r.status === VerificationStatus.VERIFIED).length;
        const falseCount = results.filter((r) => r.status === VerificationStatus.FALSE).length;
        const partiallyTrue = results.filter((r) => r.status === VerificationStatus.PARTIALLY_TRUE).length;
        const unverifiable = results.filter((r) => r.status === VerificationStatus.UNVERIFIABLE).length;
        return {
            url,
            totalClaims: claims.length,
            verified,
            false: falseCount,
            partiallyTrue,
            unverifiable,
            verificationRate: claims.length > 0 ? Math.round((verified / claims.length) * 1000) / 1000 : 0,
        };
    }
    clearCache() {
        this.cache.clear();
    }
    getCacheStats() {
        return { cachedEntries: this.cache.size };
    }
    verifyInternal(claim, referenceSources) {
        if (!claim.text) {
            return { claim, status: VerificationStatus.PENDING, confidence: 0.1, sourceCount: 0, supportingSources: 0, contradictingSources: 0, checkedAt: new Date(), notes: "Empty claim text" };
        }
        let supporting = 0;
        let contradicting = 0;
        for (const ref of referenceSources) {
            if (!ref)
                continue;
            const overlap = this.textOverlap(claim.text, ref);
            if (overlap > 0.3) {
                supporting++;
            }
            else if (claim.type === ClaimType.NUMERIC && this.hasSimilarNumbers(claim.text, ref)) {
                supporting++;
            }
            else if (claim.type === ClaimType.NUMERIC) {
                contradicting++;
            }
        }
        return this.evaluate(claim, supporting, contradicting);
    }
    evaluate(claim, supporting, contradicting) {
        const total = supporting + contradicting;
        const checkedAt = new Date();
        if (total === 0) {
            if (claim.type === ClaimType.OPINION) {
                return { claim, status: VerificationStatus.UNVERIFIABLE, confidence: 0.3, sourceCount: 0, supportingSources: 0, contradictingSources: 0, checkedAt, notes: "Opinion claim — not verifiable" };
            }
            return { claim, status: VerificationStatus.PENDING, confidence: 0.3, sourceCount: 0, supportingSources: 0, contradictingSources: 0, checkedAt, notes: "Verification pending" };
        }
        const agreement = supporting / total;
        if (agreement >= 0.8 && supporting >= 2) {
            const confidence = Math.min(0.95, 0.6 + agreement * 0.3);
            return { claim, status: VerificationStatus.VERIFIED, confidence: Math.round(confidence * 1000) / 1000, sourceCount: total, supportingSources: supporting, contradictingSources: contradicting, checkedAt, notes: `Verified by ${supporting} supporting source(s)` };
        }
        if (agreement >= 0.6) {
            const confidence = 0.5 + agreement * 0.2;
            return { claim, status: VerificationStatus.PARTIALLY_TRUE, confidence: Math.round(confidence * 1000) / 1000, sourceCount: total, supportingSources: supporting, contradictingSources: contradicting, checkedAt, notes: `Partially supported (${supporting} for, ${contradicting} against)` };
        }
        if (contradicting >= supporting) {
            const confidence = Math.max(0.4, 1.0 - agreement);
            return { claim, status: VerificationStatus.FALSE, confidence: Math.round(confidence * 1000) / 1000, sourceCount: total, supportingSources: supporting, contradictingSources: contradicting, checkedAt, notes: `Contradicted by ${contradicting} source(s)` };
        }
        return { claim, status: VerificationStatus.PENDING, confidence: 0.3, sourceCount: total, supportingSources: supporting, contradictingSources: contradicting, checkedAt, notes: "Verification pending" };
    }
    textOverlap(text1, text2) {
        const words1 = new Set(text1.toLowerCase().split(/\s+/));
        const words2 = new Set(text2.toLowerCase().split(/\s+/));
        if (words1.size === 0 || words2.size === 0)
            return 0;
        let intersection = 0;
        for (const w of words1)
            if (words2.has(w))
                intersection++;
        return intersection / Math.max(words1.size, words2.size);
    }
    hasSimilarNumbers(text1, text2) {
        const nums1 = new Set(text1.match(/\d+(?:\.\d+)?/g) ?? []);
        const nums2 = new Set(text2.match(/\d+(?:\.\d+)?/g) ?? []);
        for (const n of nums1)
            if (nums2.has(n))
                return true;
        return false;
    }
    cacheKey(claim) {
        const raw = `${claim.text}:${claim.type}:${claim.position}`;
        return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 16);
    }
}
export async function verifyClaim(claim, referenceSources) {
    const service = new FactCheckService();
    return service.verifyClaim(claim, referenceSources);
}
export async function verifySource(url, claims) {
    const service = new FactCheckService();
    return service.verifySource(url, claims);
}
//# sourceMappingURL=factcheck_service.js.map