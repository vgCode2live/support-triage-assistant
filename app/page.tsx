"use client";

import { useState } from "react";
import { parseIssueRef } from "@/lib/github";
import type { Category, ClassificationResult, Provider, Urgency } from "@/lib/providers/types";

type InputMode = "github" | "paste";
type Phase = "idle" | "loading" | "success" | "error";

const CATEGORY_LABELS: Record<Category, string> = {
  bug: "Bug",
  feature_request: "Feature Request",
  question: "Question",
  documentation: "Documentation",
  other: "Other",
};

const URGENCY_STYLES: Record<Urgency, string> = {
  low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  high: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      data && typeof data.error === "string" ? data.error : `Request failed (${response.status})`;
    throw new Error(message);
  }
  return data as T;
}

export default function Home() {
  const [mode, setMode] = useState<InputMode>("github");
  const [githubUrl, setGithubUrl] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [provider, setProvider] = useState<Provider>("anthropic");

  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [draftResponse, setDraftResponse] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setPhase("loading");

    try {
      let ticketText: string;

      if (mode === "github") {
        const trimmedUrl = githubUrl.trim();
        if (!trimmedUrl) throw new Error("Enter a GitHub issue URL first.");

        try {
          parseIssueRef(trimmedUrl);
        } catch {
          throw new Error(
            "That doesn't look like a valid GitHub issue reference. Expected a URL like https://github.com/{owner}/{repo}/issues/{number}."
          );
        }

        const issue = await fetchJson<{ title: string; body: string }>(
          `/api/github-issue?url=${encodeURIComponent(trimmedUrl)}`
        );
        ticketText = `Title: ${issue.title}\n\n${issue.body}`;
      } else {
        const trimmedText = pasteText.trim();
        if (!trimmedText) throw new Error("Paste some ticket text first.");
        ticketText = trimmedText;
      }

      const classification = await fetchJson<ClassificationResult>("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketText, provider }),
      });

      setResult(classification);
      setDraftResponse(classification.draft_response);
      setPhase("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPhase("error");
    }
  }

  const isLoading = phase === "loading";

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black sm:px-8">
      <main className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Support Ticket Triage Assistant
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Classify a GitHub issue or pasted ticket text with Anthropic or Gemini.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("github")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                mode === "github"
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "bg-black/[.06] text-zinc-700 hover:bg-black/[.1] dark:bg-white/[.08] dark:text-zinc-300 dark:hover:bg-white/[.14]"
              }`}
            >
              GitHub issue URL
            </button>
            <button
              type="button"
              onClick={() => setMode("paste")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                mode === "paste"
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "bg-black/[.06] text-zinc-700 hover:bg-black/[.1] dark:bg-white/[.08] dark:text-zinc-300 dark:hover:bg-white/[.14]"
              }`}
            >
              Paste ticket text
            </button>
          </div>

          {mode === "github" ? (
            <input
              type="text"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/owner/repo/issues/123"
              className="rounded-lg border border-black/[.1] bg-white px-3 py-2 text-sm text-black outline-none focus:border-black/[.3] dark:border-white/[.15] dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-white/[.3]"
            />
          ) : (
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste the ticket text here..."
              rows={6}
              className="rounded-lg border border-black/[.1] bg-white px-3 py-2 text-sm text-black outline-none focus:border-black/[.3] dark:border-white/[.15] dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-white/[.3]"
            />
          )}

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Provider</span>
            <div className="flex gap-2">
              {(["anthropic", "gemini"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProvider(p)}
                  className={`rounded-full px-3 py-1 text-sm capitalize transition-colors ${
                    provider === p
                      ? "bg-black text-white dark:bg-white dark:text-black"
                      : "bg-black/[.06] text-zinc-700 hover:bg-black/[.1] dark:bg-white/[.08] dark:text-zinc-300 dark:hover:bg-white/[.14]"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-fit rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-[#ccc]"
          >
            {isLoading ? "Classifying..." : "Classify ticket"}
          </button>
        </form>

        {phase === "error" && error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {phase === "success" && result && (
          <div className="mt-8 flex flex-col gap-4 rounded-lg border border-black/[.1] bg-white p-5 dark:border-white/[.15] dark:bg-zinc-900">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-black/[.06] px-3 py-1 text-sm font-medium text-zinc-800 dark:bg-white/[.08] dark:text-zinc-200">
                {CATEGORY_LABELS[result.category]}
              </span>
              <span className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${URGENCY_STYLES[result.urgency]}`}>
                {result.urgency} urgency
              </span>
              <span className="rounded-full bg-black/[.06] px-3 py-1 text-sm text-zinc-700 dark:bg-white/[.08] dark:text-zinc-300">
                {Math.round(result.confidence * 100)}% confidence
              </span>
            </div>

            {result.needs_human && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                <span className="font-medium">Needs human review.</span> {result.needs_human_reason}
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Draft response
              </label>
              <textarea
                value={draftResponse}
                onChange={(e) => setDraftResponse(e.target.value)}
                rows={6}
                className="mt-1 w-full rounded-lg border border-black/[.1] bg-white px-3 py-2 text-sm text-black outline-none focus:border-black/[.3] dark:border-white/[.15] dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-white/[.3]"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
