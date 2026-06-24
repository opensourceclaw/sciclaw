# Interactive Research Module API

## Overview

Human-in-the-loop research with session management, adaptive query generation, and real-time feedback processing.

## Classes

### HumanInLoopAdapter

- **Constructor**: `new HumanInLoopAdapter(config?: Partial<InteractiveConfig>)`
  - Config: mode, sessionTimeoutMs (60s-1h), maxTurns (5-200)
- `startSession(topic: string, userId: string, mode?: InteractionMode): InteractionSession`
  - Creates a new active session with default context
- `getSession(sessionId: string): InteractionSession | undefined`
  - Returns session; marks EXPIRED if past timeout
- `endSession(sessionId: string): InteractionSession`
- `pauseSession(sessionId: string): InteractionSession`
- `resumeSession(sessionId: string): InteractionSession`
- `processInput(sessionId: string, input: UserInput): ResearchUpdate`
  - Updates context based on action (ACCEPT/REJECT/REFINE/REDIRECT/MODIFY), records turn, checks maxTurns
- `requestUserInput(sessionId: string, message: SystemMessage): InteractionSession`
- `updateContext(sessionId: string, updates: Partial<SessionContext>): SessionContext`
- `getContext(sessionId: string): SessionContext | undefined`
- `getActiveSessions(): InteractionSession[]`
- `getSessionHistory(sessionId: string): InteractionTurn[]`
- `getTurnCount(sessionId: string): number`

### AdaptiveQueryEngine

- **Constructor**: `new AdaptiveQueryEngine(config?: Partial<InteractiveConfig>)`
- `generateQueries(context: SessionContext, history: InteractionTurn[]): AdaptiveQuery[]`
  - Context-aware: clarification (low confidence), direction (no focus), depth (early stage), validation (high confidence). Scored on relevance, novelty, preference, diversity. Returns top N.
- `prioritizeQueries(queries: AdaptiveQuery[]): AdaptiveQuery[]`
  - Sorts by priority desc
- `adaptFromFeedback(queries: AdaptiveQuery[], feedback: QueryResponse[]): AdaptiveQuery[]`
  - Adjusts priority based on user responses; filters out zero-priority queries
- `getClarificationQueries(context): AdaptiveQuery[]`
- `getDirectionQueries(context): AdaptiveQuery[]`
- `getDepthQueries(context): AdaptiveQuery[]`
- `getValidationQueries(context): AdaptiveQuery[]`
- `getQueryStats(): { totalGenerated; avgPriority }`

### RealTimeFeedback

- **Constructor**: `new RealTimeFeedback(config?: Partial<InteractiveConfig>)`
- `processFeedback(sessionId: string, input: UserInput): FeedbackResult`
  - Intent detection (regex patterns), sentiment analysis (lexicon), preference extraction
- `batchProcess(inputs: UserInput[]): FeedbackResult[]`
- `analyzeSentiment(input: UserInput): "positive" | "negative" | "neutral"`
- `detectIntent(input: UserInput): FeedbackAction`
- `extractPreferences(input: UserInput): UserPreference[]`
- `shouldAdapt(context: SessionContext): boolean`
- `computeAdaptation(context: SessionContext, feedback: FeedbackResult[]): Partial<SessionContext>`
- `getFeedbackStats(): { total; acceptRate; avgResponseTimeMs }`

### InteractiveResearchEngine

- **Constructor**: `new InteractiveResearchEngine(config?: InteractiveResearchConfig)`
- `start(topic, userId, mode?): InteractionSession`
- `endSession(sessionId): InteractionSession`
- `processInput(sessionId, input): ResearchUpdate`
  - Full pipeline: feedback → context update → adapter processing → adaptive queries
- `startResearch(topic, userId, mode?): { session; initialQueries }`
- `generateAdaptiveQuery(sessionId): AdaptiveQuery[]`
- `getStats(): { activeSessions; totalTurns; avgLatency }`

### Factory Functions

- `createHumanInLoopAdapter(config?): HumanInLoopAdapter`
- `createAdaptiveQueryEngine(config?): AdaptiveQueryEngine`
- `createRealTimeFeedback(config?): RealTimeFeedback`
- `createInteractiveResearchEngine(config?): InteractiveResearchEngine`

## Usage Example

```typescript
import { createInteractiveResearchEngine, FeedbackAction } from "deepclaw";

const engine = createInteractiveResearchEngine();

const { session, initialQueries } = engine.startResearch("AI Safety", "user-1");
// initialQueries: AdaptiveQuery[] based on context

const update = engine.processInput(session.id, {
  id: "input-1",
  action: FeedbackAction.ACCEPT,
  content: "Let's explore alignment approaches",
});
// update.suggestions, update.newQueries
```
