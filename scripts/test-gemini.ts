// Standalone CLI smoke test for the Gemini adapter, independent of the web app.
//
// Usage:
//   npm run test:gemini

import { geminiAdapter } from "../lib/providers/gemini";

const SAMPLE_TICKETS = [
  "App crashes on startup with 'segmentation fault' every time I open it on macOS 14. Started after the last update.",
  "It would be great if the export feature supported CSV in addition to JSON.",
  "How do I reset my password? I can't find the option anywhere.",
];

async function main() {
  for (const [i, ticketText] of SAMPLE_TICKETS.entries()) {
    console.log(`\n--- Sample ${i + 1} ---`);
    console.log(ticketText);
    try {
      const result = await geminiAdapter.classify(ticketText);
      console.log(JSON.stringify(result, null, 2));
    } catch (err) {
      console.error("FAILED:", err);
    }
  }
}

main();
