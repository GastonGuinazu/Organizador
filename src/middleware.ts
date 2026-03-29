import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (!req.auth && pathname.startsWith("/dashboard")) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  if (req.auth && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
