// Shared classification types + provider interface (SPEC.md 3.2-3.3).

export const CATEGORIES = [
  "bug",
  "feature_request",
  "question",
  "documentation",
  "other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const URGENCIES = ["low", "medium", "high"] as const;
export type Urgency = (typeof URGENCIES)[number];

export interface ClassificationResult {
  category: Category;
  urgency: Urgency;
  needs_human: boolean;
  needs_human_reason: string;
  /** Model's self-reported confidence, 0-1. */
  confidence: number;
  draft_response: string;
}

export type Provider = "anthropic" | "gemini";

/** Implemented by each provider adapter (lib/providers/anthropic.ts, lib/providers/gemini.ts). */
export interface ProviderAdapter {
  classify(ticketText: string): Promise<ClassificationResult>;
}

export type ClassifyTicket = (
  ticketText: string,
  provider: Provider
) => Promise<ClassificationResult>;

