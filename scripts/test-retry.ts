// Standalone test of the classifyWithRetry state machine (lib/providers/validate.ts),
// independent of the web app and of any real provider - uses a mock `attempt` fn
// so all three paths are deterministic and don't cost API calls.
//
// Usage:
//   npm run test:retry

import { classifyWithRetry, ClassificationValidationError } from "../lib/providers/validate";
import type { ClassificationResult } from "../lib/providers/types";

const VALID_RESULT: ClassificationResult = {
  category: "bug",
  urgency: "high",
  needs_human: false,
  needs_human_reason: "clear reproduction steps",
  confidence: 0.9,
  draft_response: "Thanks for the report, we're looking into it.",
};

let failures = 0;

function check(name: string, passed: boolean, detail?: unknown) {
  console.log(`${passed ? "PASS" : "FAIL"} - ${name}`, detail ?? "");
  if (!passed) failures++;
}

async function main() {
  // Case 1: valid on the first attempt - no retry needed.
  {
    let calls = 0;
    const result = await classifyWithRetry(async () => {
      calls++;
      return VALID_RESULT;
    });
    check("succeeds on first attempt without retrying", calls === 1 && result === VALID_RESULT);
  }

  // Case 2: invalid first, valid second - retry recovers.
  {
    let calls = 0;
    let sawCorrection = false;
    const result = await classifyWithRetry(async (correction) => {
      calls++;
      if (calls === 1) return { category: "not_a_real_category" };
      sawCorrection = typeof correction === "string" && correction.length > 0;
      return VALID_RESULT;
    });
    check(
      "retries once after invalid output, then succeeds",
      calls === 2 && sawCorrection && result === VALID_RESULT
    );
  }

  // Case 3: invalid both times - throws ClassificationValidationError after exactly one retry.
  {
    let calls = 0;
    try {
      await classifyWithRetry(async () => {
        calls++;
        return { nope: true };
      });
      check("throws after two invalid attempts", false, "did not throw");
    } catch (err) {
      check(
        "throws ClassificationValidationError after two invalid attempts",
        err instanceof ClassificationValidationError && calls === 2
      );
    }
  }

  // Case 4: undefined (e.g. missing tool_use block / unparseable JSON) is treated as invalid, not a crash.
  {
    let calls = 0;
    try {
      await classifyWithRetry(async () => {
        calls++;
        return undefined;
      });
      check("treats undefined as invalid and throws after retry", false, "did not throw");
    } catch (err) {
      check(
        "treats undefined as invalid and throws after retry",
        err instanceof ClassificationValidationError && calls === 2
      );
    }
  }

  if (failures > 0) {
    console.error(`\n${failures} check(s) failed`);
    process.exit(1);
  }
  console.log("\nAll checks passed");
}

main();
