import { NextResponse } from "next/server";

export async function GET() {
  const required = ["ANTHROPIC_API_KEY", "DATABASE_URL", "ENCRYPTION_KEY"];
  const missing = required.filter((k) => !process.env[k]);

  if (missing.length > 0) {
    return NextResponse.json({ status: "error", missing }, { status: 503 });
  }

  return NextResponse.json({ status: "ok", ts: new Date().toISOString() });
}
