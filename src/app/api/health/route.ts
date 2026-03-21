import { NextResponse } from "next/server";

export async function GET() {
  const warnings: string[] = [];
  if (!process.env.ANTHROPIC_API_KEY) {
    warnings.push("ANTHROPIC_API_KEY");
  }
  return NextResponse.json({
    status: "ok",
    ts: new Date().toISOString(),
    ...(warnings.length > 0 && { warnings }),
  });
}
