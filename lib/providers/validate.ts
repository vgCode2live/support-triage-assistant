import { CATEGORIES, URGENCIES, type ClassificationResult } from "./types";

// Thrown when a provider still fails schema validation after one retry
// (SPEC.md 4: "if it fails twice, surface a clear error rather than crashing").
// The API route (Phase 7) can catch this specifically to shape its error response.
export class ClassificationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClassificationValidationError";
  }
}

export function isClassificationResult(
  value: unknown
): value is ClassificationResult {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.category === "string" &&
    (CATEGORIES as readonly string[]).includes(v.category) &&
    typeof v.urgency === "string" &&
    (URGENCIES as readonly string[]).includes(v.urgency) &&
    typeof v.needs_human === "boolean" &&
    typeof v.needs_human_reason === "string" &&
    typeof v.confidence === "number" &&
    typeof v.draft_response === "string"
  );
}

export const SCHEMA_CORRECTION_INSTRUCTION =
  "Your previous response did not match the required schema. Return valid JSON matching the schema exactly, with all required fields present and correctly typed.";

/**
 * Calls `attempt()` once; if the result fails schema validation, calls it again
 * passing a correction instruction. `attempt` should return the raw parsed value
 * (or undefined/malformed data) rather than throw for provider-shape issues -
 * only let it throw for real transport/API errors, which should propagate
 * immediately rather than being retried.
 */
export async function classifyWithRetry(
  attempt: (correction?: string) => Promise<unknown>
): Promise<ClassificationResult> {
  const first = await attempt();
  if (isClassificationResult(first)) return first;

  const second = await attempt(SCHEMA_CORRECTION_INSTRUCTION);
  if (isClassificationResult(second)) return second;

  throw new ClassificationValidationError(
    "Provider returned invalid classification output after one retry"
  );
}
