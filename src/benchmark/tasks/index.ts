import type { BenchmarkTask } from "../types.js";
import { factualityTasks } from "./factuality.js";
import { completenessTasks } from "./completeness.js";
import { citationTasks } from "./citation.js";
import { reasoningTasks } from "./reasoning.js";
import { multiAgentTasks } from "./multi_agent.js";

export const allTasks: BenchmarkTask[] = [
  ...factualityTasks,
  ...completenessTasks,
  ...citationTasks,
  ...reasoningTasks,
  ...multiAgentTasks,
];
