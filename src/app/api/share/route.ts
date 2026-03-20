import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { createSharedLink } from "@/lib/db/queries/shared-links";

const schema = z.object({
  explanationId: z.string(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const session = await auth();
  const link = await createSharedLink(parsed.data.explanationId, session?.user?.id);
  const url = `${process.env.NEXTAUTH_URL}/share/${link.token}`;
  return NextResponse.json({ url, token: link.token });
}
