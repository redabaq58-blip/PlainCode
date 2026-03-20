import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSharedLink } from "@/lib/db/queries/shared-links";
import { getExplanationById } from "@/lib/db/queries/explanations";

const schema = z.object({
  explanationId: z.string().cuid(),
});

function getBaseUrl(req: NextRequest): string {
  if (process.env.APP_URL) return process.env.APP_URL;
  const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN;
  if (railwayDomain) {
    return railwayDomain.startsWith("http") ? railwayDomain : `https://${railwayDomain}`;
  }
  const origin = req.headers.get("origin");
  if (origin) return origin;
  return "http://localhost:3000";
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { explanationId } = parsed.data;

  const explanation = await getExplanationById(explanationId);
  if (!explanation) {
    return NextResponse.json({ error: "Explanation not found" }, { status: 404 });
  }

  const link = await createSharedLink(explanationId);
  const url = `${getBaseUrl(req)}/share/${link.token}`;
  return NextResponse.json({ url, token: link.token });
}
