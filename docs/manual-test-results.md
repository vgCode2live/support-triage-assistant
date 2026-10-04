# Manual test results

## Phase 10: text-only classification, 12 open issues

Twelve open GitHub issues from `actualbudget/actual` and `wger-project/wger` were each classified by both Anthropic and Gemini, using the same adapters the app uses. The input is each issue's title and body only. Run with `npm run test:phase10`. "Kind" is the category the issue was chosen to test, not a label.

The "Human judgment" column is left blank for review. `wger-project/wger#39` was skipped because it is closed.

| # | Issue | Kind | Title | Provider | Category | Urgency | Needs human | Confidence | Human judgment |
|---|---|---|---|---|---|---|---|---|---|
| 1 | actualbudget/actual/issues/1331 | bug | [Bug]: Transactions not merged when applying rules to existing transactions | anthropic | bug | high | yes | 0.78 | |
| 1 | actualbudget/actual/issues/1331 | bug | [Bug]: Transactions not merged when applying rules to existing transactions | gemini | bug | medium | yes | 0.95 | |
| 2 | actualbudget/actual/issues/2415 | bug | [Bug]: Gocardless error messages are not shown in actual budget UI | anthropic | feature_request | low | yes | 0.85 | |
| 2 | actualbudget/actual/issues/2415 | bug | [Bug]: Gocardless error messages are not shown in actual budget UI | gemini | feature_request | low | no | 0.9 | |
| 3 | actualbudget/actual/issues/3175 | bug (vague) | [Bug]: Search not working as expected. | anthropic | bug | medium | yes | 0.75 | |
| 3 | actualbudget/actual/issues/3175 | bug (vague) | [Bug]: Search not working as expected. | gemini | bug | medium | no | 0.95 | |
| 4 | actualbudget/actual/issues/2952 | bug | [Bug]: Can't link to bank on iOS | anthropic | bug | medium | yes | 0.75 | |
| 4 | actualbudget/actual/issues/2952 | bug | [Bug]: Can't link to bank on iOS | gemini | bug | medium | no | 0.95 | |
| 5 | actualbudget/actual/issues/1919 | feature (feedback) | [Feedback]: Sankey Chart | anthropic | feature_request | low | yes | 0.72 | |
| 5 | actualbudget/actual/issues/1919 | feature (feedback) | [Feedback]: Sankey Chart | gemini | feature_request | low | no | 0.95 | |
| 6 | actualbudget/actual/issues/655 | non-user (maintenance) | [Maintenance] Transaction table rewrite | anthropic | feature_request | low | yes | 0.7 | |
| 6 | actualbudget/actual/issues/655 | non-user (maintenance) | [Maintenance] Transaction table rewrite | gemini | feature_request | low | yes | 0.9 | |
| 7 | actualbudget/actual/issues/1483 | non-user (maintenance) | [Maintenance] TypeScript migration | anthropic | other | low | yes | 0.85 | |
| 7 | actualbudget/actual/issues/1483 | non-user (maintenance) | [Maintenance] TypeScript migration | gemini | other | low | no | 0.95 | |
| 8 | wger-project/wger/issues/187 | feature | Request: Include fitness tracking | anthropic | feature_request | low | yes | 0.75 | |
| 8 | wger-project/wger/issues/187 | feature | Request: Include fitness tracking | gemini | feature_request | low | no | 0.95 | |
| 9 | wger-project/wger/issues/104 | feature | Add year view in calendar | anthropic | feature_request | low | yes | 0.85 | |
| 9 | wger-project/wger/issues/104 | feature | Add year view in calendar | gemini | feature_request | low | no | 0.95 | |
| 10 | wger-project/wger/issues/139 | feature | Exercises should be assignable to multiple categories | anthropic | feature_request | low | yes | 0.8 | |
| 10 | wger-project/wger/issues/139 | feature | Exercises should be assignable to multiple categories | gemini | feature_request | low | no | 0.95 | |
| 12 | wger-project/wger/issues/163 | feature (vague) | Allow users to register without username | anthropic | feature_request | low | yes | 0.85 | |
| 12 | wger-project/wger/issues/163 | feature (vague) | Allow users to register without username | gemini | feature_request | low | yes | 0.96 | |
| 13 | wger-project/wger/issues/173 | vague (needs discussion) | Rework URL patterns | anthropic | feature_request | low | yes | 0.75 | |
| 13 | wger-project/wger/issues/173 | vague (needs discussion) | Rework URL patterns | gemini | feature_request | low | yes | 0.95 | |

## Known limitations

- **Text only.** The model sees only the issue title and body. It cannot read the repository, check existing issues, or know whether a reported bug is already fixed. Category and urgency are inferred from wording.
- **Urgency is not defined in the schema.** Anthropic and Gemini disagreed on `actualbudget/actual#1331` (high vs. medium).
- **`needs_human` has no criteria in the schema.** Anthropic set it to true for all 12 issues. Gemini set it for 4.
- **`confidence` is not calibrated.** It is the model's self-report. Gemini reported 0.90–0.96 for nearly every issue, including the vague `wger#173` (0.95).
- **No category fits internal work.** The two maintenance issues (`actualbudget/actual#655` and `#1483`) were classified as `feature_request` and `other`.
- **Title prefix not followed.** `actualbudget/actual#2415` is titled "[Bug]", but both providers classified it as `feature_request`. That may be the right call, but it is a judgment call.
- **Small sample.** Twelve issues from two repositories, one run, with no reviewed labels yet.
- **Latency.** Logged per issue for both providers together, roughly 8–10 seconds. Per-provider latency was not measured.
- **Route not covered.** The test calls the adapters directly. The classify route and its rate limiter were not part of this run.

Planned fix: define the meaning of `urgency` and `needs_human` in the tool schema, then re-run this test on the same issues to compare.
