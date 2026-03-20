import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getUserHistory } from "@/lib/db/queries/explanations";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const rawPage = parseInt(searchParams.get("page") ?? "1", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  const result = await getUserHistory(session.user.id, page);
  return NextResponse.json(result);
}
