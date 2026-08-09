import { NextRequest, NextResponse } from "next/server";
import { anthropicAdapter } from "@/lib/providers/anthropic";
import { geminiAdapter } from "@/lib/providers/gemini";
import { ClassificationValidationError } from "@/lib/providers/validate";
import type { Provider, ProviderAdapter } from "@/lib/providers/types";
import { checkRateLimit } from "@/lib/rateLimit";

const ADAPTERS: Record<Provider, ProviderAdapter> = {
  anthropic: anthropicAdapter,
  gemini: geminiAdapter,
};

function getClientKey(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return "unknown";
}

// Structured, one-line-per-request log - scaffolding for the Week 3 eval
// harness (SPEC.md 4), so the shape needs to stay consistent even though
// nothing consumes it yet.
function logRequest(entry: {
  provider: Provider;
  latencyMs: number;
  validationSucceeded: boolean;
  errorKind?: string;
}) {
  console.log(
    JSON.stringify({ event: "classify_request", timestamp: new Date().toISOString(), ...entry })
  );
}

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(getClientKey(request));
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again shortly." },
      {
        status: 429,
        headers: rateLimit.retryAfterSeconds
          ? { "Retry-After": String(rateLimit.retryAfterSeconds) }
          : undefined,
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const { ticketText, provider } = (body ?? {}) as {
    ticketText?: unknown;
    provider?: unknown;
  };

  if (typeof ticketText !== "string" || ticketText.trim().length === 0) {
    return NextResponse.json(
      { error: "`ticketText` is required and must be a non-empty string." },
      { status: 400 }
    );
  }
  if (provider !== "anthropic" && provider !== "gemini") {
    return NextResponse.json(
      { error: '`provider` must be "anthropic" or "gemini".' },
      { status: 400 }
    );
  }

  const adapter = ADAPTERS[provider];
  const start = Date.now();

  try {
    const result = await adapter.classify(ticketText);
    logRequest({ provider, latencyMs: Date.now() - start, validationSucceeded: true });
    return NextResponse.json(result);
  } catch (err) {
    const latencyMs = Date.now() - start;

    if (err instanceof ClassificationValidationError) {
      logRequest({ provider, latencyMs, validationSucceeded: false, errorKind: "validation" });
      return NextResponse.json(
        { error: "The model returned output that didn't match the expected schema, even after a retry." },
        { status: 502 }
      );
    }

    logRequest({ provider, latencyMs, validationSucceeded: false, errorKind: "provider_error" });
    return NextResponse.json({ error: "Classification failed." }, { status: 502 });
  }
}
