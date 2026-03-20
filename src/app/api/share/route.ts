import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { createSharedLink } from "@/lib/db/queries/shared-links";
import { getExplanationById } from "@/lib/db/queries/explanations";

const schema = z.object({
  explanationId: z.string().cuid(),
});

function getBaseUrl(req: NextRequest): string {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
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

  const session = await auth();
  const { explanationId } = parsed.data;

  const explanation = await getExplanationById(explanationId);
  if (!explanation) {
    return NextResponse.json({ error: "Explanation not found" }, { status: 404 });
  }

  // Authorization: only the owner can create a share link for their explanation
  if (explanation.userId && explanation.userId !== session?.user?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const link = await createSharedLink(explanationId, session?.user?.id);
  const url = `${getBaseUrl(req)}/share/${link.token}`;
  return NextResponse.json({ url, token: link.token });
}
