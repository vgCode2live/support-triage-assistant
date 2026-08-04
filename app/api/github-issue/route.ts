import { NextResponse } from "next/server";

// GET owner/repo/number -> { title, body }
// Implemented in Phase 6 (SPEC.md section 4).
export async function GET() {
  return NextResponse.json({ error: "not implemented" }, { status: 501 });
}
