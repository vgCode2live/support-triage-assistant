import { GoogleGenAI, Type } from "@google/genai";
import {
  CATEGORIES,
  URGENCIES,
  type ClassificationResult,
  type ProviderAdapter,
} from "./types";

const MODEL = "gemini-flash-latest";

const CLASSIFY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    category: { type: Type.STRING, enum: [...CATEGORIES] },
    urgency: { type: Type.STRING, enum: [...URGENCIES] },
    needs_human: { type: Type.BOOLEAN },
    needs_human_reason: { type: Type.STRING },
    confidence: { type: Type.NUMBER },
    draft_response: { type: Type.STRING },
  },
  required: [
    "category",
    "urgency",
    "needs_human",
    "needs_human_reason",
    "confidence",
    "draft_response",
  ],
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

let client: GoogleGenAI | undefined;
function getClient(): GoogleGenAI {
  if (!client) client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

async function classify(ticketText: string): Promise<ClassificationResult> {
  const response = await getClient().models.generateContent({
    model: MODEL,
    contents: `Classify the following support ticket / GitHub issue:\n\n${ticketText}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: CLASSIFY_SCHEMA,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini response did not contain any text");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Gemini response was not valid JSON");
  }

  if (!isClassificationResult(parsed)) {
    throw new Error("Gemini response failed schema validation");
  }
  return parsed;
}

export const geminiAdapter: ProviderAdapter = { classify };
