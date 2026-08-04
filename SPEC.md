# Specification: Support Ticket Triage Assistant (Week 1 MVP)

## 1. One-liner
A deployed web app that takes a support ticket (fetched from a real GitHub issue, or pasted text) and returns a structured triage decision: category, urgency, whether it needs a human, and a draft response.

## 2. Users & use case
Single user (the builder) for now. No auth, no multi-tenancy, no persistence required in Week 1. The "user" pastes or selects a ticket and reads the result on screen.

## 3. Functional Requirements

### 3.1 Input
- Primary path: fetch a real GitHub issue via the GitHub REST API, given either:
  - a full issue URL (e.g. `https://github.com/{owner}/{repo}/issues/{number}`), or
  - owner/repo/issue-number fields
- Secondary path: a plain textarea where the user can paste arbitrary ticket text directly (for testing edge cases without needing a real issue)
- Only the issue's title + body are used as input to the model (comments are out of scope for Week 1)

### 3.2 Classification output
Every request returns a single JSON object matching this shape (field names are canonical; provider-specific schema wrappers differ, see 3.4):

| Field | Type | Notes |
|---|---|---|
| `category` | enum: `bug`, `feature_request`, `question`, `documentation`, `other` | primary issue type |
| `urgency` | enum: `low`, `medium`, `high` | based on impact/tone |
| `needs_human` | boolean | true if too ambiguous/risky for an AI-only response |
| `needs_human_reason` | string | one short sentence justifying the boolean |
| `confidence` | number, 0-1 | model's self-reported confidence |
| `draft_response` | string | 2-4 sentence suggested reply, ready to edit |

### 3.3 Provider abstraction (required, not optional)
The app must support calling **both Anthropic (Claude) and Gemini** behind a single internal interface, selectable via a config value or UI toggle. This isn't just an abstraction exercise — running the identical task through two providers side by side is the only real way to compare their structured-output reliability, latency, and classification behavior firsthand, and it avoids locking a long-running piece of tooling into a single vendor's pricing or rate limits.

Proposed interface (implementation language may adjust):
```
classifyTicket(ticketText: string, provider: "anthropic" | "gemini"): Promise<ClassificationResult>
```
Both provider implementations must return the exact same `ClassificationResult` shape. Provider-specific schema translation (Anthropic tool-use vs. Gemini function-calling/response_schema) lives inside each provider's adapter, not in calling code.

### 3.4 Provider schemas
**Anthropic (tool-use):**
```json
{
  "name": "classify_ticket",
  "description": "Classify a support ticket or GitHub issue and draft a response",
  "input_schema": {
    "type": "object",
    "properties": {
      "category": { "type": "string", "enum": ["bug", "feature_request", "question", "documentation", "other"] },
      "urgency": { "type": "string", "enum": ["low", "medium", "high"] },
      "needs_human": { "type": "boolean" },
      "needs_human_reason": { "type": "string" },
      "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
      "draft_response": { "type": "string" }
    },
    "required": ["category", "urgency", "needs_human", "needs_human_reason", "confidence", "draft_response"]
  }
}
```

**Gemini (function calling, or `response_schema` + `application/json` mime type as the simpler alternative):**
```json
{
  "name": "classify_ticket",
  "description": "Classify a support ticket or GitHub issue and draft a response",
  "parameters": {
    "type": "OBJECT",
    "properties": {
      "category": { "type": "STRING", "enum": ["bug", "feature_request", "question", "documentation", "other"] },
      "urgency": { "type": "STRING", "enum": ["low", "medium", "high"] },
      "needs_human": { "type": "BOOLEAN" },
      "needs_human_reason": { "type": "STRING" },
      "confidence": { "type": "NUMBER" },
      "draft_response": { "type": "STRING" }
    },
    "required": ["category", "urgency", "needs_human", "needs_human_reason", "confidence", "draft_response"]
  }
}
```

### 3.5 UI
- Single page
- Input controls: GitHub URL field OR paste-text field (toggle or two tabs), provider selector (Anthropic / Gemini)
- Submit action calls the classification endpoint and renders the result: category, urgency badge, needs-human flag (with reason), confidence, draft response (editable textarea)
- Loading and error states required (e.g. malformed GitHub URL, API failure, model returned invalid schema)

## 4. Non-Functional Requirements
- **Secrets:** API keys (Anthropic, Gemini, optional GitHub PAT) loaded from environment variables only. Never committed. `.env.example` checked in with placeholder names; `.env` gitignored.
- **Deployment target:** GCP Cloud Run, containerized (Dockerfile required). Must be reachable via a public URL.
- **Cost/abuse guard:** basic per-IP or per-session rate limit (even a naive in-memory limiter is acceptable for Week 1) since this will be a public URL hitting metered APIs.
- **Error handling:** if a provider returns output that fails schema validation, retry once with an explicit "return valid JSON matching the schema" correction; if it fails twice, surface a clear error rather than crashing.
- **Logging:** log each request's provider, latency, and whether schema validation succeeded — this is scaffolding for the eval harness in Week 3, so plan the log shape now even though nothing consumes it yet.
- **No database required** for Week 1 — stateless request/response is sufficient.

## 5. Explicitly Out of Scope (Week 1)
- RAG / knowledge base retrieval
- Tool-use / function calls that take real actions
- Agentic loops or multi-step reasoning
- Batch processing of multiple issues at once
- Auto-sending responses (draft only, always)
- Authentication / multi-user support
- Persisting classification history to a database
- The eval harness itself (Week 3) — only its logging groundwork

## 6. Tech Stack Decision
- **Language/framework:** TypeScript + Next.js (App Router), API routes handle both the GitHub fetch and the LLM calls; single deployable repo for frontend + backend.
- **Deployment:** Docker container on GCP Cloud Run.
- **Providers:** `@anthropic-ai/sdk` and `@google/genai` (the current unified Gemini SDK), behind the shared interface in 3.3.
- **No ORM/database in Week 1.**

Rationale: keeps solo full-stack velocity high, plays to a stack I already know well so the time budget goes toward the LLM engineering problem rather than learning a new framework, and Cloud Run containerizes a Next.js app cleanly without extra orchestration overhead.

## 7. Definition of Done (Week 1)
1. Public Cloud Run URL, live and shareable
2. Successfully classifies a real GitHub issue fetched live via the GitHub API (not just pasted text)
3. Returns schema-valid JSON on both Anthropic and Gemini providers
4. Tested manually against 10-15 varied real issues; failures/edge cases noted in README
5. `.env.example`, README (what it does, why, how to run), and Dockerfile all present
