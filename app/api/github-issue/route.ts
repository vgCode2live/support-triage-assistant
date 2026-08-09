import { NextRequest, NextResponse } from "next/server";
import { fetchGithubIssue, GithubFetchError } from "@/lib/github";

const STATUS_BY_KIND: Record<GithubFetchError["kind"], number> = {
  invalid_input: 400,
  not_found: 404,
  rate_limited: 429,
  unknown: 502,
};

// GET ?url={full issue URL} or ?owner=&repo=&number= -> { title, body }
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const url = params.get("url");
  const owner = params.get("owner");
  const repo = params.get("repo");
  const number = params.get("number");

  const ref = url ?? (owner && repo && number ? `${owner}/${repo}/${number}` : null);
  if (!ref) {
    return NextResponse.json(
      { error: "Provide a `url` query param (GitHub issue URL) or `owner`, `repo`, and `number`." },
      { status: 400 }
    );
  }

  try {
    const issue = await fetchGithubIssue(ref);
    return NextResponse.json(issue);
  } catch (err) {
    if (err instanceof GithubFetchError) {
      return NextResponse.json({ error: err.message }, { status: STATUS_BY_KIND[err.kind] });
    }
    return NextResponse.json({ error: "Failed to fetch GitHub issue" }, { status: 502 });
  }
}
