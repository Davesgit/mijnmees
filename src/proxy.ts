import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { APP_COOKIE, appDoorsturing, isAppVerzoek } from "@/features/app/appmodus";

// Ververst de Supabase-sessie (cookies) bij elke paginaweergave. Autorisatie zelf gebeurt in de datalaag.
export async function proxy(request: NextRequest) {
  // App-modus testen in een gewone browser: ?app=1 zet hem aan, ?app=0 weer uit.
  const appParam = request.nextUrl.searchParams.get("app");
  if (appParam === "1" || appParam === "0") {
    const schoon = request.nextUrl.clone();
    schoon.searchParams.delete("app");
    const naar = NextResponse.redirect(schoon);
    if (appParam === "1") naar.cookies.set(APP_COOKIE, "1", { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
    else naar.cookies.delete(APP_COOKIE);
    return naar;
  }
  if (isAppVerzoek(request.headers.get("user-agent"), request.cookies.get(APP_COOKIE)?.value)) {
    const doel = appDoorsturing(request.nextUrl.pathname);
    if (doel) return NextResponse.redirect(new URL(doel, request.url));
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  await supabase.auth.getClaims();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|assets/|favicon|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
