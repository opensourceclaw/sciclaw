/**
 * SciClaw v3.9.0 — OBSERVE Stage
 */

import type { ResearchContext } from "../context/ResearchContext.js";

export interface ObserveResult {
  topic: string;
  questions: string[];
  scope: string;
}

export async function observeStage(input: string): Promise<ObserveResult> {
  const topic = extractTopic(input);
  const questions = generateQuestions(topic, input);
  const scope = defineScope(topic, questions);
  return { topic, questions, scope };
}

function extractTopic(input: string): string {
  const sentences = input.split(/[.!?]/).filter(s => s.trim().length > 0);
  return sentences[0]?.trim() ?? input.substring(0, 100);
}

function generateQuestions(topic: string, _input: string): string[] {
  const words = topic.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const questions: string[] = [];
  questions.push(`What is ${topic}?`);
  if (words.length > 0) {
    questions.push(`What are the key aspects of ${words.slice(0, 3).join(" ")}?`);
  }
  questions.push(`What are the latest developments in ${topic}?`);
  questions.push(`What are the challenges in ${topic}?`);
  questions.push(`What are the future trends in ${topic}?`);
  return questions.slice(0, 5);
}

function defineScope(topic: string, questions: string[]): string {
  return `Research scope: ${topic}, addressing ${questions.length} key questions`;
}

export function applyObserve(context: ResearchContext, result: ObserveResult): ResearchContext {
  return {
    ...context,
    topic: result.topic,
    questions: result.questions,
    stage: "plan",
  };
}
