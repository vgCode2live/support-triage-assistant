import { GoogleGenAI, Type } from "@google/genai";
import { CATEGORIES, URGENCIES, type ClassificationResult, type ProviderAdapter } from "./types";
import { classifyWithRetry } from "./validate";

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

let client: GoogleGenAI | undefined;
function getClient(): GoogleGenAI {
  if (!client) client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

async function classify(ticketText: string): Promise<ClassificationResult> {
  async function attempt(correction?: string): Promise<unknown> {
    const prompt = correction
      ? `Classify the following support ticket / GitHub issue:\n\n${ticketText}\n\n${correction}`
      : `Classify the following support ticket / GitHub issue:\n\n${ticketText}`;

    const response = await getClient().models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: CLASSIFY_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) return undefined;
    try {
      return JSON.parse(text);
    } catch {
      return undefined;
    }
  }

  return classifyWithRetry(attempt);
}

export const geminiAdapter: ProviderAdapter = { classify };
