export interface GithubIssue {
  title: string;
  body: string;
}

export type GithubFetchErrorKind = "invalid_input" | "not_found" | "rate_limited" | "unknown";

export class GithubFetchError extends Error {
  kind: GithubFetchErrorKind;
  constructor(message: string, kind: GithubFetchErrorKind = "unknown") {
    super(message);
    this.name = "GithubFetchError";
    this.kind = kind;
  }
}

interface IssueRef {
  owner: string;
  repo: string;
  number: number;
}

// Accepts a full issue URL (https://github.com/{owner}/{repo}/issues/{number})
// or a short form (owner/repo/123 or owner/repo#123).
export function parseIssueRef(input: string): IssueRef {
  const trimmed = input.trim();

  const urlMatch = trimmed.match(
    /github\.com\/([^/\s]+)\/([^/\s]+)\/issues\/(\d+)/i
  );
  if (urlMatch) {
    return { owner: urlMatch[1], repo: urlMatch[2], number: Number(urlMatch[3]) };
  }

  const shortMatch = trimmed.match(/^([^/\s]+)\/([^/\s]+)[/#](\d+)$/);
  if (shortMatch) {
    return { owner: shortMatch[1], repo: shortMatch[2], number: Number(shortMatch[3]) };
  }

  throw new GithubFetchError(
    `Could not parse a GitHub issue reference from "${input}". Expected a full issue URL or owner/repo/number.`,
    "invalid_input"
  );
}

export async function fetchGithubIssue(input: string): Promise<GithubIssue> {
  const { owner, repo, number } = parseIssueRef(input);

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues/${number}`,
    { headers }
  );

  if (response.status === 404) {
    throw new GithubFetchError(`Issue not found: ${owner}/${repo}#${number}`, "not_found");
  }

  if (response.status === 403 || response.status === 429) {
    const remaining = response.headers.get("x-ratelimit-remaining");
    if (remaining === "0" || response.status === 429) {
      throw new GithubFetchError(
        "GitHub API rate limit exceeded. Set GITHUB_TOKEN in .env to raise the limit, or try again later.",
        "rate_limited"
      );
    }
  }

  if (!response.ok) {
    throw new GithubFetchError(
      `GitHub API error (${response.status}) fetching ${owner}/${repo}#${number}`,
      "unknown"
    );
  }

  const data = await response.json();
  return { title: data.title ?? "", body: data.body ?? "" };
}
