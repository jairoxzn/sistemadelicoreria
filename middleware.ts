import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { isRouteAllowed, defaultRouteForRole } from "@/lib/rbac";

const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = ["/login", "/catalogo"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const session = req.auth;

  if (!session?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL(defaultRouteForRole(session.user.role), req.url));
  }

  if (!isRouteAllowed(pathname, session.user.role)) {
    return NextResponse.redirect(new URL(defaultRouteForRole(session.user.role), req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)"],
};
