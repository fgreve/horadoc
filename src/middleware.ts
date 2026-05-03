import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  const {
    nextUrl: { pathname },
  } = request;

  const protectedPaths = ["/dashboard", "/alerts", "/notifications", "/settings"];
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  if (isProtected) {
    const supabaseResponse = response;
    const hasSession =
      supabaseResponse.headers.get("x-middleware-request-cookie")?.includes("sb-") ||
      request.cookies.getAll().some((c) => c.name.includes("auth-token"));

    if (!hasSession) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
