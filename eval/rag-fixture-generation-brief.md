# Task: Generate RAG evaluation fixtures from 3 real GitHub repositories

## Context

I'm building a support-ticket triage assistant that classifies GitHub issues using an LLM. The next phase adds repo-aware classification: before classifying an issue, the system retrieves relevant pieces of the target repository (code, docs, config) and gives them to the model as context, instead of classifying from the issue text alone.

To know whether that retrieval step actually works, I need a labeled evaluation set: realistic questions about a codebase, each paired with the exact file(s) that contain the real answer, and a reference answer. I do not have time to hand-write this set myself across many repos, so this task asks you to generate it.

The bar for the downstream system is "good enough," not perfect accuracy. But the fixtures you produce here are the ground truth everything else gets measured against, so **every fixture must be grounded in content you actually read**, not inferred or guessed from a repo's name, README summary, or general knowledge of the library.

## Your task, in order

1. Select **3 public GitHub repositories** meeting the criteria below.
2. For each repo, generate **8-12 fixtures** (so 24-36 total) using the method below.
3. Output everything in the exact file/schema format specified below.

## Repo selection criteria

Pick 3 repos that together satisfy all of these:

- **Public and real.** No private repos, no repos requiring authentication to clone or browse.
- **Small to medium size.** Roughly 500-5,000 lines of actual source code, excluding generated files, vendored dependencies, and lockfiles. Small enough that someone could sanity-check your picks without being overwhelmed.
- **Mainstream language.** JavaScript, TypeScript, Python, Go, Java, Ruby, or similar. Avoid obscure or legacy languages.
- **Has real documentation.** A README with actual content, and/or docstrings/comments in the code, so there's genuine knowledge to retrieve beyond raw logic.
- **Has a public issue tracker with real issues**, ideally some closed and some open, since several fixture types below mirror "is this already handled" and "is this a duplicate" questions.
- **Application or library style**, not a pure data/config/awesome-list repo. There needs to be actual behavior to ask questions about.
- **The 3 repos should differ from each other** in domain or purpose. Don't pick three CLI tools, or three of the same kind of app.

Do not pick repos based on popularity alone. Judge each one against the criteria above.

## How to generate each fixture (method)

For every fixture, follow these steps in order. Do not skip step 1.

1. **Open and actually read a real file** in the repo (or a specific, real function/section within it). Everything in the fixture must trace back to this reading, not to assumptions about what a repo like this "probably" does.
2. **Identify one concrete, nontrivial, answerable fact or behavior** documented or implemented there.
3. **Write a natural-language question**, phrased the way a developer or support agent might actually ask it. The correct answer must require that specific fact. It must not be answerable from the question text alone, and must not be genuinely ambiguous or "it depends."
4. **Record the expected source**: exact repo-relative file path(s), and where it helps, the function/class name or line range.
5. **Write a reference answer**: either a short correct answer (2-4 sentences), or a bullet list of key facts a correct answer must include.
6. **Assign a `question_type`** from this fixed list only:
   - `code_behavior` — what does this function/module actually do
   - `config_or_setup` — how is this configured, installed, or run
   - `existing_feature_check` — does the repo already do X (mirrors "is this a duplicate feature request")
   - `possible_duplicate` — does an existing issue already cover this problem
   - `bug_status` — is a specific bug fixed, open, or still present in current code
   - `documentation_lookup` — what do the docs say about X
7. **Assign a `difficulty`**: `easy` (answer lives in one obvious file), `medium`, or `hard` (requires connecting 2+ files, or inferring something not explicitly stated).
8. **Write a one-sentence rationale** explaining what you read that grounds this fixture.

### Mix to aim for, per repo

- At least 2 fixtures of type `existing_feature_check` or `possible_duplicate`
- At least 2 fixtures of type `code_behavior`
- A spread of difficulty — not all `easy`
- 8-12 fixtures total per repo

### What not to do

- Do not invent facts not actually present in what you read.
- Do not write trivial questions answerable from the question text itself (for example, "what language is this written in").
- Do not write questions with an ambiguous or undeterminable correct answer.
- Do not use any repo requiring authentication.

## Output format (required)

Produce one JSON file per repo, named `<repo-slug>.fixtures.json` (for example, `octocat-hello-world.fixtures.json`), matching this schema exactly:

```json
{
  "repo": {
    "owner": "string",
    "name": "string",
    "url": "https://github.com/owner/name",
    "commit_sha_or_ref": "the exact commit SHA, tag, or branch you read from, so fixtures stay reproducible",
    "primary_language": "string",
    "approx_loc": 0,
    "selection_rationale": "1-2 sentences on why this repo was picked"
  },
  "fixtures": [
    {
      "id": "repo-slug-001",
      "question": "string",
      "question_type": "code_behavior | config_or_setup | existing_feature_check | possible_duplicate | bug_status | documentation_lookup",
      "difficulty": "easy | medium | hard",
      "expected_source": [
        { "path": "relative/path/to/file.ext", "symbol": "optional function or class name", "lines": "optional, e.g. 10-42" }
      ],
      "reference_answer": "a string answer, or an array of key facts that must appear in a correct answer",
      "rationale": "one sentence: what you read that grounds this fixture"
    }
  ]
}
```

Also produce one `index.md` that summarizes: the 3 repos picked and why, the total fixture count, and the output filenames.

## Delivery

- If you can write files directly, create `index.md` plus the 3 `<repo-slug>.fixtures.json` files.
- If you can only reply in chat, paste the full content of each file in its own fenced code block, clearly labeled with its filename, so it can be copied out directly.

## Self-check before you finish

- [ ] Every fact cited is grounded in a file you actually opened and read, not guessed
- [ ] Every fixture lists a specific `expected_source`
- [ ] No duplicate questions, within or across repos
- [ ] All JSON is valid
- [ ] Exactly 3 repos, 8-12 fixtures each, all required `question_type` coverage met per repo
