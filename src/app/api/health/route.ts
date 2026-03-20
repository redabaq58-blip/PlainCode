import { NextResponse } from "next/server";

export async function GET() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ status: "error", missing: ["ANTHROPIC_API_KEY"] }, { status: 503 });
  }
  return NextResponse.json({ status: "ok", ts: new Date().toISOString() });
}
