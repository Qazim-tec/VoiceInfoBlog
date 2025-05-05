import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SOCIAL_MEDIA_CRAWLERS =
  /WhatsApp|facebookexternalhit|Twitterbot|LinkedInBot|Slackbot|Googlebot/i;

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") || "";
  const isCrawler = SOCIAL_MEDIA_CRAWLERS.test(userAgent);
  const pathname = request.nextUrl.pathname;

  // For /post/:slug crawler requests, rewrite to Edge Function
  if (pathname.startsWith("/post/") && isCrawler) {
    const slug = pathname.split("/").pop();
    if (slug) {
      return NextResponse.rewrite(new URL(`/api/post/${slug}`, request.url));
    }
  }

  // For all other requests, serve index.html
  return NextResponse.rewrite(new URL("/index.html", request.url));
}

export const config = {
  matcher: ["/:path*"],
};