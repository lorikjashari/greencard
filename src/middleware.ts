import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "gck_session";
const SEEN_COOKIE = "gck_admin_seen";
const IDLE_MS = 30 * 60 * 1000;

/**
 * 30-minute idle guard for the staff area. The signed session caps total
 * lifetime at 8 hours; this cookie caps inactivity. A production deployment
 * should also enforce this server-side (see README security notes).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin/login") || pathname.startsWith("/admin/denied")) {
    return NextResponse.next();
  }

  if (!request.cookies.get(SESSION_COOKIE)?.value) {
    return NextResponse.next();
  }

  const now = Date.now();
  const seenRaw = request.cookies.get(SEEN_COOKIE)?.value;
  const seen = seenRaw ? Number(seenRaw) : Number.NaN;

  if (Number.isFinite(seen) && (now - seen > IDLE_MS || seen - now > 60_000)) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "?error=idle";
    const response = NextResponse.redirect(url);
    response.cookies.delete(SESSION_COOKIE);
    response.cookies.delete(SEEN_COOKIE);
    return response;
  }

  const response = NextResponse.next();
  response.cookies.set(SEEN_COOKIE, String(now), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: IDLE_MS / 1000,
  });
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
