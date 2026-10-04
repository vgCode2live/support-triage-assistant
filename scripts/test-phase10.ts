// Manual test pass (PLAN.md Phase 10). Runs real GitHub issues through both provider
// adapters directly (no route, no rate limiter) and prints a markdown table to stdout.
// Progress and skipped issues go to the terminal (stderr) and to phase10-run.log.
//
// Usage:
//   npm run test:phase10 > phase10-results.md

import { appendFileSync, writeFileSync } from "node:fs";
import { parseIssueRef } from "../lib/github";
import { anthropicAdapter } from "../lib/providers/anthropic";
import { geminiAdapter } from "../lib/providers/gemini";
import type { ClassificationResult, ProviderAdapter } from "../lib/providers/types";

// `kind` is the test category the issue was chosen for, not a ground-truth label.
const ISSUES: { url: string; kind: string }[] = [
  { url: "https://github.com/actualbudget/actual/issues/1331", kind: "bug" },
  { url: "https://github.com/actualbudget/actual/issues/2415", kind: "bug" },
  { url: "https://github.com/actualbudget/actual/issues/3175", kind: "bug (vague)" },
  { url: "https://github.com/actualbudget/actual/issues/2952", kind: "bug" },
  { url: "https://github.com/actualbudget/actual/issues/1919", kind: "feature (feedback)" },
  { url: "https://github.com/actualbudget/actual/issues/655", kind: "non-user (maintenance)" },
  { url: "https://github.com/actualbudget/actual/issues/1483", kind: "non-user (maintenance)" },
  { url: "https://github.com/wger-project/wger/issues/187", kind: "feature" },
  { url: "https://github.com/wger-project/wger/issues/104", kind: "feature" },
  { url: "https://github.com/wger-project/wger/issues/139", kind: "feature" },
  { url: "https://github.com/wger-project/wger/issues/39", kind: "question (one-line title)" },
  { url: "https://github.com/wger-project/wger/issues/163", kind: "feature (vague)" },
  { url: "https://github.com/wger-project/wger/issues/173", kind: "vague (needs discussion)" },
];

interface GithubIssueMeta {
  title: string;
  body: string;
  state: string;
  isPullRequest: boolean;
}

// Same request the app makes in lib/github.ts, plus the state and PR flag this script needs.
async function fetchIssueMeta(url: string): Promise<GithubIssueMeta> {
  const { owner, repo, number } = parseIssueRef(url);
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${number}`, {
    headers,
  });
  if (!response.ok) throw new Error(`GitHub API ${response.status} for ${url}`);

  const data = await response.json();
  return {
    title: data.title ?? "",
    body: data.body ?? "",
    state: data.state,
    isPullRequest: Boolean(data.pull_request),
  };
}

async function classifyWith(
  adapter: ProviderAdapter,
  ticketText: string
): Promise<ClassificationResult | string> {
  try {
    return await adapter.classify(ticketText);
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}

// Keeps table cells on one line and stops pipe characters from breaking the markdown.
function cell(value: string, max = 160): string {
  const flat = value.replace(/\s+/g, " ").replace(/\|/g, "\\|").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

function row(
  index: number,
  issue: string,
  kind: string,
  title: string,
  provider: string,
  result: ClassificationResult | string
): string {
  if (typeof result === "string") {
    return `| ${index} | ${issue} | ${cell(kind)} | ${cell(title, 80)} | ${provider} | ERROR: ${cell(result)} | | | | |`;
  }
  return `| ${index} | ${issue} | ${cell(kind)} | ${cell(title, 80)} | ${provider} | ${result.category} | ${result.urgency} | ${result.needs_human ? "yes" : "no"} | ${result.confidence} | |`;
}

const LOG_FILE = "phase10-run.log";

function log(message: string) {
  const line = `${new Date().toISOString()} ${message}`;
  console.error(line);
  appendFileSync(LOG_FILE, `${line}\n`);
}

async function main() {
  writeFileSync(LOG_FILE, "");
  console.log(
    "| # | Issue | Kind | Title | Provider | Category | Urgency | Needs human | Confidence | Human judgment |"
  );
  console.log("|---|---|---|---|---|---|---|---|---|---|");

  let index = 0;
  for (const { url, kind } of ISSUES) {
    index++;
    const issueRef = url.replace("https://github.com/", "");

    let meta: GithubIssueMeta;
    try {
      meta = await fetchIssueMeta(url);
    } catch (err) {
      log(`skip ${issueRef}: ${err instanceof Error ? err.message : err}`);
      continue;
    }
    if (meta.isPullRequest || meta.state !== "open") {
      log(`skip ${issueRef}: not an open issue (state=${meta.state}, pr=${meta.isPullRequest})`);
      continue;
    }

    // Matches the ticket text the UI builds in app/page.tsx.
    const ticketText = `Title: ${meta.title}\n\n${meta.body}`;
    log(`classifying ${issueRef} ...`);

    const anthropic = await classifyWith(anthropicAdapter, ticketText);
    console.log(row(index, issueRef, kind, meta.title, "anthropic", anthropic));

    const gemini = await classifyWith(geminiAdapter, ticketText);
    console.log(row(index, issueRef, kind, meta.title, "gemini", gemini));
  }
}

main();
