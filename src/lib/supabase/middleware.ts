import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Build-time fallback so `next build` doesn't crash when env vars are missing
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";

const AUTH_PAGES = new Set(["/login", "/signup", "/verify"]);

const PUBLIC_EXACT = new Set([
  "/", "/onboarding", "/forgot-password", "/banned",
  "/terms", "/privacy", "/pricing", "/about", "/why-chatterbox",
  "/download", "/features", "/security", "/careers",
  "/changelog", "/contact", "/status",
]);

const PUBLIC_PREFIXES = ["/invite", "/api", "/blog"];

function isPublicPath(pathname: string) {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthPage = AUTH_PAGES.has(pathname);
  const isPublic = isPublicPath(pathname);

  // Short-circuit: public pages don't need auth — skip the getUser() RPC entirely
  if (isPublic && !isAuthPage) {
    return NextResponse.next({ request });
  }

  // Only create client + call getUser() for protected and auth pages
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isAuthPage) {
    const url = request.nextUrl.clone();
    const redirectPath = pathname + request.nextUrl.search;
    url.pathname = "/login";
    url.searchParams.set("redirect", redirectPath);
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Onboarding gate: redirect users who haven't completed onboarding
  // Uses strict === false so existing users (undefined) pass through
  if (user && user.user_metadata?.onboarding_completed === false) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
