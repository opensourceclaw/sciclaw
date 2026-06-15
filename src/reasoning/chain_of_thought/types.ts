/**
 * Chain of Thought types
 */

export enum DecompositionStrategy {
  BROAD = 'broad',
  DEEP = 'deep',
  BALANCED = 'balanced',
}

export enum StepStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

export interface DecomposedStep {
  id: string;
  stepNumber: number;
  subQuestion: string;
  parentId?: string;
  dependencies: string[];
  strategy: DecompositionStrategy;
  depth: number;
  status: StepStatus;
}

export interface ReasoningStepResult {
  step: DecomposedStep;
  reasoning: string;
  result: unknown;
  confidence: number;
  sources: string[];
  durationMs: number;
  error?: string;
}

export interface ReasoningChain {
  id: string;
  originalQuestion: string;
  strategy: DecompositionStrategy;
  steps: ReasoningStepResult[];
  finalResult: unknown;
  confidence: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface ChainOfThoughtConfig {
  maxDepth: number;
  maxSteps: number;
  retryCount: number;
  timeoutMs: number;
}
