import { NextResponse } from "next/server";

// POST { ticketText, provider } -> ClassificationResult
// Implemented in Phase 7 (SPEC.md section 4).
export async function POST() {
  return NextResponse.json({ error: "not implemented" }, { status: 501 });
}
