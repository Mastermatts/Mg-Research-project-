import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/onboarding"];
const ADMIN_PREFIXES = ["/admin"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => path.startsWith(p));
  const isAdminRoute = ADMIN_PREFIXES.some((p) => path.startsWith(p));

  if (isProtected && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectTo", path);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAdminRoute || (isProtected && path.startsWith("/dashboard"))) {
    if (user) {
      if (isAdminRoute) {
        // Admin access is governed by admin_users (RBAC), not profiles.role —
        // profiles.role === "admin" alone is no longer sufficient.
        const { data: adminRow } = await supabase
          .from("admin_users")
          .select("is_active")
          .eq("id", user.id)
          .single();

        if (!adminRow?.is_active) {
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
      }

      if (path.startsWith("/dashboard")) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed, account_status")
          .eq("id", user.id)
          .single();

        if (profile?.account_status === "deactivated") {
          return NextResponse.redirect(new URL("/login?deactivated=1", request.url));
        }

        if (profile && !profile.onboarding_completed) {
          return NextResponse.redirect(new URL("/onboarding", request.url));
        }
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files and image optimization.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)",
  ],
};
