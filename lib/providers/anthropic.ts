import Anthropic from "@anthropic-ai/sdk";
import { CATEGORIES, URGENCIES, type ClassificationResult, type ProviderAdapter } from "./types";
import { classifyWithRetry } from "./validate";

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

let client: Anthropic | undefined;
function getClient(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

async function classify(ticketText: string): Promise<ClassificationResult> {
  async function attempt(correction?: string): Promise<unknown> {
    const prompt = correction
      ? `Classify the following support ticket / GitHub issue:\n\n${ticketText}\n\n${correction}`
      : `Classify the following support ticket / GitHub issue:\n\n${ticketText}`;

    const response = await getClient().messages.create({
      model: MODEL,
      max_tokens: 1024,
      tools: [CLASSIFY_TOOL],
      tool_choice: { type: "tool", name: CLASSIFY_TOOL.name },
      messages: [{ role: "user", content: prompt }],
    });

    const toolUse = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );
    return toolUse?.input;
  }

  return classifyWithRetry(attempt);
}

export const anthropicAdapter: ProviderAdapter = { classify };
