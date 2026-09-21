import type { AuthorityScore } from "./types.js";
export declare class AuthorityScorer {
    private credentialWeight;
    private institutionWeight;
    private citationWeight;
    private recognitionWeight;
    constructor(weights?: {
        credential?: number;
        institution?: number;
        citation?: number;
        recognition?: number;
    });
    scoreAuthority(author?: string, institution?: string, citationCount?: number): AuthorityScore;
    private scoreCredentials;
    private scoreInstitution;
    private scoreCitations;
    private scoreNameRecognition;
}
export declare function scoreAuthority(author?: string, institution?: string, citationCount?: number): AuthorityScore;
//# sourceMappingURL=authority_scorer.d.ts.map