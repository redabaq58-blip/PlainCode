import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/history", "/settings"];

export default auth(function middleware(req: NextRequest & { auth: { user?: { id: string } } | null }) {
  const { pathname } = req.nextUrl;

  // Protect specific routes
  if (PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!req.auth?.user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
