import Anthropic from "@anthropic-ai/sdk";
import {
  CATEGORIES,
  URGENCIES,
  type ClassificationResult,
  type ProviderAdapter,
} from "./types";

const MODEL = "claude-sonnet-5";

const CLASSIFY_TOOL: Anthropic.Tool = {
  name: "classify_ticket",
  description:
    "Classify a support ticket or GitHub issue and draft a response",
  input_schema: {
    type: "object",
    properties: {
      category: { type: "string", enum: [...CATEGORIES] },
      urgency: { type: "string", enum: [...URGENCIES] },
      needs_human: { type: "boolean" },
      needs_human_reason: { type: "string" },
      confidence: { type: "number", minimum: 0, maximum: 1 },
      draft_response: { type: "string" },
    },
    required: [
      "category",
      "urgency",
      "needs_human",
      "needs_human_reason",
      "confidence",
      "draft_response",
    ],
  },
};

// Basic shape check. Full validation + retry-on-failure lands in Phase 5.
function isClassificationResult(value: unknown): value is ClassificationResult {
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

let client: Anthropic | undefined;
function getClient(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

async function classify(ticketText: string): Promise<ClassificationResult> {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 1024,
    tools: [CLASSIFY_TOOL],
    tool_choice: { type: "tool", name: CLASSIFY_TOOL.name },
    messages: [
      {
        role: "user",
        content: `Classify the following support ticket / GitHub issue:\n\n${ticketText}`,
      },
    ],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );
  if (!toolUse) {
    throw new Error("Anthropic response did not contain a tool_use block");
  }
  if (!isClassificationResult(toolUse.input)) {
    throw new Error("Anthropic tool_use input failed schema validation");
  }
  return toolUse.input;
}

export const anthropicAdapter: ProviderAdapter = { classify };
