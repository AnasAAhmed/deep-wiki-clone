import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const publicPaths = ["/auth/login", "/auth/signup", "/auth/forget/send-otp", "/auth/forget/verify-email", "/auth/forget/confirm-password"];
    const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

    const sessionCookie = req.cookies.get("session")?.value;

    //for demo purposes anyone
    // if (!sessionCookie && !isPublicPath) {
    //     const loginUrl = req.nextUrl.clone();
    //     loginUrl.pathname = "/auth/login";
    //     return NextResponse.redirect(loginUrl);
    // }

    // if (sessionCookie && isPublicPath) {
    //     // add a fastApi sessin check here to see if session Cookie is valid
    //     const homeUrl = req.nextUrl.clone();
    //     homeUrl.pathname = "/";
    //     return NextResponse.redirect(homeUrl);
    // }

    return NextResponse.next();
}
export const config = {
  matcher: [
    "/((?!_next|.*\\..*|api|trpc|pricing).*)",
  ],
};