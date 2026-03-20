import { NextResponse } from "next/server";

/**
 * Health check endpoint for Railway.
 * Returns 200 when the app is running.
 * Returns 503 if required environment variables are missing.
 */
export async function GET() {
  const required = ["ANTHROPIC_API_KEY", "NEXTAUTH_SECRET", "DATABASE_URL"];
  const missing = required.filter((k) => !process.env[k]);

  if (missing.length > 0) {
    return NextResponse.json(
      { status: "error", missing },
      { status: 503 }
    );
  }

  return NextResponse.json({ status: "ok", ts: new Date().toISOString() });
}
