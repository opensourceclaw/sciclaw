/**
 * Causal Analysis types
 */

export interface CausalVariable {
  id: string;
  name: string;
  aliases: string[];
  context: string;
  occurrences: number;
}

export interface CausalRelation {
  id: string;
  sourceId: string;
  targetId: string;
  relation: string;
  strength: number;
  direction: 'positive' | 'negative' | 'unknown';
  confidence: number;
  evidence: string[];
}

export interface CausalGraph {
  id: string;
  variables: CausalVariable[];
  relations: CausalRelation[];
  metadata: {
    sourceText: string;
    createdAt: Date;
    variableCount: number;
    relationCount: number;
  };
}

export interface ImpactPath {
  from: string;
  to: string;
  description: string;
  strength: number;
}

export interface ImpactAnalysis {
  chainId: string;
  rootCause: string;
  impactPaths: ImpactPath[];
  summary: string;
}
