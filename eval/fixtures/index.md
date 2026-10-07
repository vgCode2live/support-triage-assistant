# RAG eval fixtures

Generated per `eval/rag-fixture-generation-brief.md`. Each fixture's question was written after reading the cited source, not the other way around, so `expected_source` is grounded rather than guessed.

## Repos

| Repo | Language | Approx LOC (source only) | Commit read | Fixtures |
|---|---|---|---|---|
| [expressjs/cors](https://github.com/expressjs/cors) | JavaScript | 238 | `5317ebe670db2aaebc1d496eb5d33493deefb3ed` | 10 |
| [python-humanize/humanize](https://github.com/python-humanize/humanize) | Python | 1,725 | `785e5dcc0d0308ad0dff3f6cc0faa7085ad0375b` | 10 |
| [fatih/color](https://github.com/fatih/color) | Go | 889 | `820c6ebc21b06a3a5328297d556a87f91556e577` | 10 |

Total: 3 repos, 30 fixtures.

`cors` is below the brief's 500 LOC target (238 lines in `lib/index.js`). It was kept because it's a complete, real, heavily-documented middleware with a genuine regression test tied to a numbered issue (`test/issue-2.js`), not a toy snippet.

## Files

- `cors.fixtures.json`
- `humanize.fixtures.json`
- `color.fixtures.json`

## Fixture type coverage

Each repo has at least 2 `code_behavior` fixtures and at least 2 fixtures of type `existing_feature_check`/`possible_duplicate`/`bug_status`, per the brief's required mix. `humanize` and `color` each include one `bug_status` fixture grounded in a real, numbered GitHub issue fetched from the repo's issue tracker (not invented):

- `humanize-010`: python-humanize/humanize#108 — confirmed still reproducible in current code (years > 1 case).
- `color-007`: fatih/color#250 — confirmed fixed in current code.
- `color-008`: fatih/color#31 — confirmed only partially addressed in current code.

`cors-008` is grounded in a real regression test (`test/issue-2.js`) rather than a live GitHub issue, since the repo's open issue tracker didn't surface a comparably concrete, in-code-checkable case.

## What's not done yet

- No `Human judgment` / reviewer sign-off column exists for these fixtures yet, unlike `docs/manual-test-results.md`. Before using these for real RAG scoring, spot-check a sample per repo.
- These fixtures test a human/LLM reading comprehension of each repo's source. They don't yet test retrieval (i.e., whether an embedding/search step actually surfaces `expected_source` for a given `question`). That wiring is part of Phase 13.
