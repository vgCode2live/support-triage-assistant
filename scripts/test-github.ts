// Standalone CLI smoke test for the GitHub issue fetch helper, independent of the web app.
//
// Usage:
//   npm run test:github

import { fetchGithubIssue, parseIssueRef } from "../lib/github";

// Both confirmed open (not closed) and not pull requests via the GitHub API -
// GitHub issue/PR numbers share one sequence per repo, and a PR shows up in the
// issues API too (with a `pull_request` field), so a low issue number can easily
// turn out to be a merged PR rather than a real, untriaged issue.
const SAMPLES = [
  "https://github.com/actualbudget/actual/issues/1331", // [Bug] report
  "wger-project/wger/187", // feature request
];

async function main() {
  for (const ref of SAMPLES) {
    console.log(`\n--- ${ref} ---`);
    try {
      console.log("parsed:", parseIssueRef(ref));
      const issue = await fetchGithubIssue(ref);
      console.log("title:", issue.title);
      console.log("body (first 200 chars):", issue.body.slice(0, 200));
    } catch (err) {
      console.error("FAILED:", err);
    }
  }
}

main();
